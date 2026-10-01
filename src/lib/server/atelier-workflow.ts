import "server-only";

import type {
  OrderWorkflowStatus,
  RequestWorkflowStatus,
  WorkflowEvent,
} from "@/lib/atelier-workflow";
import { normalizeRequestStatus } from "@/lib/atelier-workflow";
import { requireStaff } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type JsonObject = Record<string, unknown>;

interface ProfileSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface AdminReferenceImage {
  path: string;
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
  signedUrl?: string;
}

export interface AdminRequestRecord {
  id: string;
  requestReference: string;
  customer: ProfileSummary | null;
  status: RequestWorkflowStatus;
  styleId?: string;
  styleCode?: string;
  styleName?: string;
  styleImage?: string;
  garmentCategory?: string;
  isIdeaPath: boolean;
  fabric: JsonObject;
  colour: JsonObject;
  preferences: JsonObject;
  fitPreference?: string;
  measurementsSnapshot: JsonObject;
  measurementConfidence: boolean;
  occasion?: string;
  eventName?: string;
  eventDate?: string;
  requiredDate?: string;
  appointmentRequest: JsonObject | null;
  referenceImages: AdminReferenceImage[];
  specialInstructions?: string;
  contactInfo: JsonObject;
  clientMessage?: string;
  lastClientResponse?: string;
  reviewedBy?: string;
  reviewStartedAt?: string;
  decisionAt?: string;
  submittedAt?: string;
  lastSubmittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedRevision?: number;
  revision: number;
  lockVersion: number;
  declineReason?: string;
  resubmissionCount: number;
  createdAt: string;
  updatedAt: string;
  convertedOrder?: { id: string; orderReference: string };
  timeline: WorkflowEvent[];
}

export interface AdminOrderRecord {
  id: string;
  orderReference: string;
  customer: ProfileSummary | null;
  bespokeRequestId?: string;
  requestReference?: string;
  styleId: string;
  styleCode: string;
  styleName: string;
  styleImage?: string;
  garmentCategory?: string;
  fabricDetails: JsonObject;
  colourDetails: JsonObject;
  preferences: JsonObject;
  measurementsSnapshot: JsonObject;
  status: OrderWorkflowStatus;
  targetCompletionDate?: string;
  productionStageUpdatedAt?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
  timeline: WorkflowEvent[];
}

interface RawProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface RawLifecycleEvent {
  id: string;
  entity_type: string;
  entity_id: string | null;
  event_type: string;
  actor_type: WorkflowEvent["actorType"];
  actor_id: string | null;
  metadata: JsonObject | null;
  created_at: string;
}

// PostgREST records are normalized at this server-only boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function profileSummary(row: RawProfile | undefined): ProfileSummary | null {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
  };
}

function mapTimeline(row: RawLifecycleEvent): WorkflowEvent {
  return {
    id: row.id,
    entityType: row.entity_type,
    eventType: row.event_type,
    actorType: row.actor_type,
    actorId: row.actor_id ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

async function signReferenceImages(images: AdminReferenceImage[]): Promise<AdminReferenceImage[]> {
  const paths = images.map((image) => image.path).filter(Boolean);
  if (paths.length === 0) return images;
  const { data, error } = await getSupabaseAdminClient()
    .storage
    .from("bespoke-references")
    .createSignedUrls(paths, 60 * 30);
  if (error) {
    console.error("Bespoke reference signing failed", { code: error.name, message: error.message });
    return images;
  }
  const urlByPath = new Map((data ?? []).map((item) => [item.path, item.signedUrl]));
  return images.map((image) => ({ ...image, signedUrl: urlByPath.get(image.path) ?? undefined }));
}

async function resolveStyleImage(row: Row): Promise<string | undefined> {
  const snapshot = row.style_image_snapshot;
  if (
    snapshot &&
    typeof snapshot === "object" &&
    !Array.isArray(snapshot) &&
    snapshot.kind === "storage" &&
    snapshot.bucket === "catalogue-media" &&
    typeof snapshot.path === "string"
  ) {
    const { data, error } = await getSupabaseAdminClient()
      .storage
      .from("catalogue-media")
      .createSignedUrl(snapshot.path, 60 * 30);
    if (!error && data?.signedUrl) return data.signedUrl;
    console.error("Request style image signing failed", {
      code: error?.name,
      message: error?.message,
    });
  }
  return row.style_image ?? undefined;
}

async function loadProfiles(customerIds: string[]) {
  const uniqueIds = [...new Set(customerIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, RawProfile>();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email,phone")
    .in("id", uniqueIds);
  if (error) throw error;
  return new Map(((data ?? []) as RawProfile[]).map((profile) => [profile.id, profile]));
}

async function loadEvents(entityType: "bespoke_request" | "order", entityIds: string[]) {
  if (entityIds.length === 0) return new Map<string, WorkflowEvent[]>();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("lifecycle_events")
    .select("id,entity_type,entity_id,event_type,actor_type,actor_id,metadata,created_at")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const events = new Map<string, WorkflowEvent[]>();
  for (const row of (data ?? []) as RawLifecycleEvent[]) {
    if (!row.entity_id) continue;
    events.set(row.entity_id, [...(events.get(row.entity_id) ?? []), mapTimeline(row)]);
  }
  return events;
}

function mapReferences(value: unknown): AdminReferenceImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as JsonObject;
    if (typeof row.path !== "string") return [];
    return [{
      path: row.path,
      filename: typeof row.filename === "string" ? row.filename : "Client reference",
      mimeType: typeof row.mimeType === "string" ? row.mimeType : undefined,
      sizeBytes: typeof row.sizeBytes === "number" ? row.sizeBytes : undefined,
    }];
  });
}

export async function getAdminRequests(): Promise<AdminRequestRecord[]> {
  await requireStaff();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("bespoke_requests")
    .select("id,request_reference,customer_id,style_id,style_code,style_name,style_image,style_image_snapshot,garment_category,is_idea_path,fabric,colour,preferences,fit_preference,measurements_snapshot,measurement_confidence,occasion,event_name,event_date,required_date,appointment_request,reference_images,special_instructions,contact_info,status,clarification_notes,submitted_at,last_submitted_at,reviewed_at,reviewed_by,approved_at,approved_by,approved_revision,revision,lock_version,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Admin request query failed", { code: error.code, message: error.message });
    throw new Error("REQUEST_MANAGEMENT_UNAVAILABLE");
  }

  const rows = (data ?? []) as Row[];
  const [profiles, events, orderResult] = await Promise.all([
    loadProfiles(rows.map((row) => row.customer_id).filter(Boolean)),
    loadEvents("bespoke_request", rows.map((row) => row.id)),
    rows.length
      ? supabase
          .from("orders")
          .select("id,order_reference,bespoke_request_id")
          .in("bespoke_request_id", rows.map((row) => row.id))
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (orderResult.error) throw orderResult.error;
  const orderByRequest = new Map(
    (orderResult.data ?? []).map((order) => [
      order.bespoke_request_id,
      { id: order.id, orderReference: order.order_reference },
    ])
  );

  return Promise.all(rows.map(async (row): Promise<AdminRequestRecord> => ({
    id: row.id,
    requestReference: row.request_reference,
    customer: profileSummary(profiles.get(row.customer_id)),
    status: normalizeRequestStatus(row.status),
    styleId: row.style_id ?? undefined,
    styleCode: row.style_code ?? undefined,
    styleName: row.style_name ?? undefined,
    styleImage: await resolveStyleImage(row),
    garmentCategory: row.garment_category ?? undefined,
    isIdeaPath: row.is_idea_path,
    fabric: row.fabric ?? {},
    colour: row.colour ?? {},
    preferences: row.preferences ?? {},
    fitPreference: row.fit_preference ?? undefined,
    measurementsSnapshot: row.measurements_snapshot ?? {},
    measurementConfidence: row.measurement_confidence === true,
    occasion: row.occasion ?? undefined,
    eventName: row.event_name ?? undefined,
    eventDate: row.event_date ?? undefined,
    requiredDate: row.required_date ?? undefined,
    appointmentRequest: row.appointment_request ?? null,
    referenceImages: await signReferenceImages(mapReferences(row.reference_images)),
    specialInstructions: row.special_instructions ?? undefined,
    contactInfo: row.contact_info ?? {},
    clientMessage: row.clarification_notes ?? undefined,
    lastClientResponse: [...(events.get(row.id) ?? [])]
      .reverse()
      .find((event) => event.eventType === "request_resubmitted")?.metadata.message as string | undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewStartedAt: row.reviewed_at ?? (events.get(row.id) ?? [])
      .find((event) => event.eventType === "request_under_review")?.createdAt,
    decisionAt: row.approved_at ?? (events.get(row.id) ?? [])
      .find((event) => event.eventType === "request_declined")?.createdAt,
    submittedAt: row.submitted_at ?? undefined,
    lastSubmittedAt: row.last_submitted_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    approvedRevision: row.approved_revision ?? undefined,
    revision: row.revision ?? 1,
    lockVersion: row.lock_version ?? 1,
    declineReason: [...(events.get(row.id) ?? [])]
      .reverse()
      .find((event) => event.eventType === "request_declined")?.metadata.message as string | undefined,
    resubmissionCount: Math.max(0, (row.revision ?? 1) - 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    convertedOrder: orderByRequest.get(row.id),
    timeline: events.get(row.id) ?? [],
  })));
}

export async function getAdminRequest(requestId: string): Promise<AdminRequestRecord | null> {
  const requests = await getAdminRequests();
  return requests.find((request) => request.id === requestId) ?? null;
}

export async function getAdminOrders(): Promise<AdminOrderRecord[]> {
  await requireStaff();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_reference,customer_id,bespoke_request_id,style_id,style_code,style_name,style_image,garment_category,fabric_details,colour_details,preferences,measurements_snapshot,accepted_request_snapshot,status,target_completion_date,production_stage_updated_at,special_instructions,created_at,updated_at,lock_version")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Admin order query failed", { code: error.code, message: error.message });
    throw new Error("ORDER_MANAGEMENT_UNAVAILABLE");
  }
  const rows = (data ?? []) as Row[];
  const requestIds = rows.map((row) => row.bespoke_request_id).filter(Boolean);
  const [profiles, events, requestResult] = await Promise.all([
    loadProfiles(rows.map((row) => row.customer_id).filter(Boolean)),
    loadEvents("order", rows.map((row) => row.id)),
    requestIds.length
      ? supabase.from("bespoke_requests").select("id,request_reference").in("id", requestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (requestResult.error) throw requestResult.error;
  const requestReferenceById = new Map(
    (requestResult.data ?? []).map((request) => [request.id, request.request_reference])
  );

  return Promise.all(rows.map(async (row): Promise<AdminOrderRecord> => ({
    id: row.id,
    orderReference: row.order_reference,
    customer: profileSummary(profiles.get(row.customer_id)),
    bespokeRequestId: row.bespoke_request_id ?? undefined,
    requestReference: requestReferenceById.get(row.bespoke_request_id),
    styleId: row.style_id,
    styleCode: row.style_code,
    styleName: row.style_name,
    styleImage: await resolveStyleImage({
      style_image: row.style_image,
      style_image_snapshot: row.accepted_request_snapshot?.style_image_snapshot,
    }),
    garmentCategory: row.garment_category ?? undefined,
    fabricDetails: row.fabric_details ?? {},
    colourDetails: row.colour_details ?? {},
    preferences: row.preferences ?? {},
    measurementsSnapshot: row.measurements_snapshot ?? {},
    status: row.status as OrderWorkflowStatus,
    targetCompletionDate: row.target_completion_date ?? undefined,
    productionStageUpdatedAt: row.production_stage_updated_at ?? undefined,
    specialInstructions: row.special_instructions ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockVersion: row.lock_version ?? 1,
    timeline: events.get(row.id) ?? [],
  })));
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderRecord | null> {
  const orders = await getAdminOrders();
  return orders.find((order) => order.id === orderId) ?? null;
}
