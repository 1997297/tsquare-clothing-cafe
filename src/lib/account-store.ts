"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import { isDemoMode, isSupabaseConfigured, supabase } from "./supabase/client";
import {
  saveMeasurementProfileAction,
  submitBespokeRequestAction,
} from "@/app/account/actions";
import type {
  AppointmentChangeRequest,
  ConciergeMessage,
  ConciergeRequest,
  CustomerAppointment,
  CustomerMeasurementRecord,
  CustomerNotification,
  CustomerOrder,
  PaymentRecord,
  WardrobeItem,
} from "@/types";
import type { BespokeRequestPayload } from "@/types/bespoke";
import type { WorkflowEvent } from "@/lib/atelier-workflow";
import { APPOINTMENT_COLUMNS, APPOINTMENT_CHANGE_COLUMNS, CONCIERGE_COLUMNS } from "@/lib/atelier-service";

// PostgREST rows are mapped at this boundary into the application's typed domain models.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

interface AccountData {
  measurements: CustomerMeasurementRecord[];
  requests: BespokeRequestPayload[];
  orders: CustomerOrder[];
  appointments: CustomerAppointment[];
  notifications: CustomerNotification[];
  payments: PaymentRecord[];
  wardrobe: WardrobeItem[];
  conciergeRequests: ConciergeRequest[];
  conciergeMessages: ConciergeMessage[];
  appointmentChanges: AppointmentChangeRequest[];
}

const EMPTY_DATA: AccountData = {
  measurements: [],
  requests: [],
  orders: [],
  appointments: [],
  notifications: [],
  payments: [],
  wardrobe: [],
  conciergeRequests: [],
  conciergeMessages: [],
  appointmentChanges: [],
};

const SAMPLE_DEMO_DATA: AccountData = {
  measurements: [
    {
      id: "meas-01",
      customerId: "client-default",
      version: 1,
      isCurrent: true,
      unit: "inches",
      fitPreference: "tailored",
      verificationStatus: "tsquare_verified",
      measurements: {
        chest: 42,
        waist: 34,
        shoulder: 18.5,
        sleeve: 25.5,
        neck: 16.5,
        trouserLength: 41,
        bicep: 14.5,
        thigh: 24,
      },
      notes: "Measured during private fitting in Abeokuta Salon Suite.",
      createdAt: "2026-09-10T11:00:00Z",
    },
  ],
  requests: [
    {
      requestId: "TCC-REQ-9842",
      status: "pricing_ready",
      isIdeaPath: false,
      createdAt: "2026-09-12T14:30:00Z",
      styleId: "tsq-agbada-024",
      styleCode: "TSQ AGBADA 024",
      styleName: "Imperial Grand Agbada 4-Piece",
      styleImage: "/images/styles/agbada-imperial.jpg",
      garmentCategory: "agbada",
      fabric: { id: "fab-01", name: "Heavyweight Virgin Wool & Mulberry Silk", description: "Super 140s weave", categories: ["agbada"] },
      colour: { id: "col-01", name: "Deep Emerald & Gold", hex: "#1A472A" },
      preferences: { specialInstructions: "Double-needle hand embroidery along placket" },
      fitPreference: "tailored",
      quotedPrice: 380000,
      contact: {
        firstName: "Adeyemi",
        lastName: "Alabi",
        email: "client@tsquare.com",
        phone: "+2348012345678",
        preferredContact: "whatsapp",
      },
    },
  ],
  orders: [
    {
      id: "ord-tcc-0842",
      orderReference: "TCC-ORD-0842",
      customerId: "client-default",
      bespokeRequestId: "TCC-REQ-9842",
      styleId: "tsq-agbada-024",
      styleCode: "TSQ AGBADA 024",
      styleName: "Imperial Grand Agbada 4-Piece",
      garmentCategory: "agbada",
      status: "in_production",
      totalAmount: 350000,
      targetCompletionDate: "2026-10-18",
      measurementsSnapshot: { chest: 42, waist: 34, shoulder: 18.5 },
      createdAt: "2026-09-15T10:00:00Z",
    },
  ],
  appointments: [
    {
      id: "apt-1092",
      customerId: "client-default",
      type: "first_fitting",
      preferredDate: "2026-10-02",
      preferredTime: "11:30 AM",
      status: "confirmed",
      location: "VIP Salon Suite, Abeokuta Atelier",
      notes: "First canvas basted fitting for Imperial Agbada.",
      createdAt: "2026-09-15T16:30:00Z",
    },
  ],
  notifications: [
    {
      id: "notif-01",
      customerId: "client-default",
      type: "production_update",
      title: "Garment Entering Hand Needlework",
      message: "Your TSQ AGBADA 024 has passed canvas basting and is now with our master embroiderers.",
      relatedEntityType: "order",
      relatedEntityId: "ord-tcc-0842",
      isRead: false,
      createdAt: "2026-09-21T09:00:00Z",
    },
  ],
  payments: [
    {
      id: "pay-01",
      orderId: "ord-tcc-0842",
      customerId: "client-default",
      amount: 100000,
      currency: "NGN",
      type: "deposit",
      provider: "atelier_terminal",
      providerReference: "ATELIER_TCC-PAY-260921-DEP",
      internalReference: "TCC-PAY-260921-DEP",
      status: "successful",
      paidAt: "2026-09-21T11:00:00Z",
      metadata: { note: "Initial Bespoke Production Deposit" },
      createdAt: "2026-09-21T11:00:00Z",
    },
    {
      id: "pay-02",
      orderId: "ord-tcc-0842",
      customerId: "client-default",
      amount: 110000,
      currency: "NGN",
      type: "installment",
      provider: "atelier_terminal",
      providerReference: "ATELIER_TCC-PAY-260922-INS",
      internalReference: "TCC-PAY-260922-INS",
      status: "successful",
      paidAt: "2026-09-22T14:30:00Z",
      metadata: { note: "Milestone 1 — Basting Stage Complete" },
      createdAt: "2026-09-22T14:30:00Z",
    },
  ],
  wardrobe: [
    {
      id: "ward-01",
      customerId: "client-default",
      orderId: "ord-tcc-0720",
      styleId: "tsq-senator-012",
      styleCode: "TSQ SENATOR 012",
      styleName: "Asymmetric Placket Senator",
      category: "senator",
      heroImage: "/images/styles/senator-executive.jpg",
      galleryImages: ["/images/styles/senator-executive.jpg"],
      fabricSnapshot: { name: "Italian Cashmere-Wool Blend", finish: "Matte Crisp" },
      colourSnapshot: { name: "Obsidian Midnight", hex: "#161618" },
      preferencesSnapshot: { collarType: "Mandarin Minimalist", buttonType: "Concealed Gunmetal Snap" },
      measurementsSnapshot: { chest: 42, waist: 34, shoulder: 18.5, trouserLength: 41 },
      completionDate: "2026-08-14T15:00:00Z",
      craftsmanshipNotes: "Specialist dry clean only. Steam gently with garment steamer; do not press iron directly on asymmetric embroidery.",
      createdAt: "2026-08-14T15:00:00Z",
    },
  ],
  conciergeRequests: [
    {
      id: "conc-01",
      referenceCode: "TCC-CONC-8821",
      customerId: "client-default",
      category: "style_consultation",
      subject: "Fabric pairing recommendation for November wedding in Lagos",
      message: "Good day, I am attending a high-profile traditional wedding in Lagos this November and would like advice on whether the raw silk Agbada can be matched with a contrasting woven cap.",
      status: "in_review",
      relatedOrderId: "ord-tcc-0842",
      createdAt: "2026-09-20T10:15:00Z",
      updatedAt: "2026-09-20T14:30:00Z",
    },
  ],
  conciergeMessages: [
    {
      id: "cmsg-01",
      requestId: "conc-01",
      senderType: "customer",
      senderName: "Adeyemi Alabi",
      message: "Good day, I am attending a high-profile traditional wedding in Lagos this November and would like advice on whether the raw silk Agbada can be matched with a contrasting woven cap.",
      createdAt: "2026-09-20T10:15:00Z",
    },
    {
      id: "cmsg-02",
      requestId: "conc-01",
      senderType: "concierge",
      senderName: "TSquare Private Stylist Desk",
      message: "Warm regards Adeyemi. For your November celebration, pairing the Deep Emerald wool-silk Agbada with a hand-woven Aso-Oke fila in antique gold with subtle emerald threading creates an extraordinary, regal balance. We have archived three matching weave swatches in your dossier.",
      createdAt: "2026-09-20T14:30:00Z",
    },
  ],
  appointmentChanges: [],
};

function mapMeasurement(row: Row): CustomerMeasurementRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    version: row.version,
    isCurrent: row.is_current,
    unit: row.unit,
    fitPreference: row.fit_preference ?? undefined,
    verificationStatus: row.verification_status,
    measurements: row.measurements ?? {},
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function mapWorkflowEvent(row: Row): WorkflowEvent {
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

function catalogueSnapshotPath(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const snapshot = value as Row;
  return snapshot.kind === "storage" &&
    snapshot.bucket === "catalogue-media" &&
    typeof snapshot.path === "string"
    ? snapshot.path
    : undefined;
}

function mapRequest(row: Row, timeline: WorkflowEvent[] = []): BespokeRequestPayload {
  const snapshot = row.measurements_snapshot ?? {};
  const references = Array.isArray(row.reference_images) ? row.reference_images : [];
  return {
    databaseId: row.id,
    requestId: row.request_reference,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    styleId: row.style_id ?? undefined,
    styleCode: row.style_code ?? undefined,
    styleName: row.style_name ?? undefined,
    styleImage: row.style_image ?? undefined,
    garmentCategory: row.garment_category ?? undefined,
    isIdeaPath: row.is_idea_path,
    fabric: row.fabric ?? undefined,
    colour: row.colour ?? undefined,
    preferences: {
      ...(row.preferences ?? {}),
      specialInstructions: row.special_instructions ?? "",
      referenceImages: references,
    },
    fitPreference: row.fit_preference ?? undefined,
    measurementMethod: snapshot.method ?? undefined,
    measurementUnit: snapshot.unit ?? undefined,
    measurements: snapshot.values ?? snapshot,
    measurementConfidence: row.measurement_confidence,
    occasion: row.occasion ?? undefined,
    eventName: row.event_name ?? undefined,
    eventDate: row.event_date ?? undefined,
    requiredDate: row.required_date ?? undefined,
    appointmentRequest: row.appointment_request ?? undefined,
    contact: row.contact_info ?? {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      preferredContact: "",
    },
    quotedPrice:
      row.quoted_price_minor == null ? undefined : Number(row.quoted_price_minor) / 100,
    clientMessage: row.clarification_notes ?? undefined,
    lastClientResponse: [...timeline]
      .reverse()
      .find((event) => event.eventType === "request_resubmitted")?.metadata.message as string | undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewStartedAt: row.reviewed_at ?? timeline
      .find((event) => event.eventType === "request_under_review")?.createdAt,
    decisionAt: row.approved_at ?? [...timeline]
      .reverse()
      .find((event) => event.eventType === "request_declined")?.createdAt,
    approvedAt: row.approved_at ?? undefined,
    approvedRevision: row.approved_revision ?? undefined,
    revision: row.revision ?? 1,
    lockVersion: row.lock_version ?? 1,
    resubmissionCount: Math.max(0, (row.revision ?? 1) - 1),
    timeline,
    persistence: "database",
  };
}

function mapOrder(row: Row, timeline: WorkflowEvent[] = []): CustomerOrder {
  return {
    id: row.id,
    orderReference: row.order_reference,
    customerId: row.customer_id,
    bespokeRequestId: row.bespoke_request_id ?? undefined,
    styleId: row.style_id,
    styleCode: row.style_code,
    styleName: row.style_name,
    styleImage: row.style_image ?? undefined,
    garmentCategory: row.garment_category ?? undefined,
    fabricDetails: row.fabric_details ?? undefined,
    colourDetails: row.colour_details ?? undefined,
    preferences: row.preferences ?? {},
    measurementsSnapshot: row.measurements_snapshot ?? {},
    status: row.status,
    totalAmount:
      row.total_amount_minor == null ? undefined : Number(row.total_amount_minor) / 100,
    targetCompletionDate: row.target_completion_date ?? undefined,
    productionStageUpdatedAt: row.production_stage_updated_at ?? undefined,
    specialInstructions: row.special_instructions ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    lockVersion: row.lock_version ?? 1,
    timeline,
  };
}

function mapAppointment(row: Row): CustomerAppointment {
  return {
    id: row.id,
    customerId: row.customer_id,
    bespokeRequestId: row.bespoke_request_id ?? undefined,
    orderId: row.order_id ?? undefined,
    type: row.type,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    confirmedDate: row.confirmed_date ?? undefined,
    confirmedTime: row.confirmed_time ?? undefined,
    scheduledStartAt: row.scheduled_start_at ?? undefined,
    scheduledEndAt: row.scheduled_end_at ?? undefined,
    status: row.status,
    location: row.location,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapNotification(row: Row): CustomerNotification {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    isRead: row.is_read,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapPayment(row: Row): PaymentRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    amount: Number(row.amount_minor) / 100,
    currency: row.currency,
    type: row.type,
    provider: row.provider,
    providerReference: row.provider_reference ?? undefined,
    internalReference: row.internal_reference,
    status: row.status,
    paidAt: row.paid_at ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapWardrobe(row: Row): WardrobeItem {
  const measurementContext = row.measurements_snapshot ?? {};
  return {
    id: row.id,
    customerId: row.customer_id,
    orderId: row.order_id,
    styleId: row.style_id,
    styleCode: row.style_code,
    styleName: row.style_name,
    category: row.category,
    heroImage: row.hero_image,
    galleryImages: row.gallery_images ?? [],
    fabricSnapshot: row.fabric_snapshot ?? {},
    colourSnapshot: row.colour_snapshot ?? {},
    preferencesSnapshot: row.preferences_snapshot ?? {},
    measurementsSnapshot: measurementContext.values ?? measurementContext,
    measurementContext,
    occasion: row.occasion ?? undefined,
    completionDate: row.completion_date,
    craftsmanshipNotes: row.craftsmanship_notes ?? undefined,
    createdAt: row.created_at,
  };
}

function mapConciergeRequest(row: Row): ConciergeRequest {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    customerId: row.customer_id,
    category: row.category,
    subject: row.subject,
    message: row.message,
    relatedRequestId: row.related_request_id ?? undefined,
    relatedOrderId: row.related_order_id ?? undefined,
    relatedAppointmentId: row.related_appointment_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}


function mapAppointmentChange(row: Row): AppointmentChangeRequest {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    customerId: row.customer_id,
    changeType: row.change_type,
    proposedDate: row.proposed_date ?? undefined,
    proposedTime: row.proposed_time ?? undefined,
    reason: row.reason ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

interface AccountDataContextValue extends AccountData {
  data: AccountData;
  isLoading: boolean;
  error: string | null;
  currentMeasurement?: CustomerMeasurementRecord;
  measurementHistory: CustomerMeasurementRecord[];
  unreadNotificationsCount: number;
  reloadData: () => Promise<void>;
  saveMeasurementProfile: (
    measurements: Record<string, number>,
    unit: "cm" | "inches",
    fitPreference?: "tailored" | "regular" | "relaxed",
    notes?: string
  ) => Promise<void>;
  addBespokeRequest: (payload: BespokeRequestPayload) => Promise<BespokeRequestPayload>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AccountDataContext = createContext<AccountDataContextValue | undefined>(undefined);

export function AccountDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const pathname = usePathname();
  const userId = user?.id;
  const needsAccountData = pathname.startsWith("/account") || pathname.startsWith("/bespoke/create/");
  const [data, setData] = useState<AccountData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!userId) {
      setData(EMPTY_DATA);
      setError(null);
      setIsLoading(false);
      return;
    }
    if (!needsAccountData) {
      setIsLoading(false);
      return;
    }
    if (!isSupabaseConfigured || (isDemoMode && userId === "client-default")) {
      setData(SAMPLE_DEMO_DATA);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const results = await Promise.all([
      supabase.from("measurement_profiles").select("*").eq("customer_id", userId).order("version", { ascending: false }),
      supabase.from("bespoke_requests").select("id,request_reference,customer_id,style_id,style_code,style_name,style_image,style_image_snapshot,garment_category,is_idea_path,fabric,colour,preferences,fit_preference,measurements_snapshot,measurement_confidence,occasion,event_name,event_date,required_date,appointment_request,reference_images,special_instructions,contact_info,status,quoted_price_minor,clarification_notes,submitted_at,last_submitted_at,reviewed_at,reviewed_by,approved_at,approved_by,approved_revision,revision,lock_version,created_at,updated_at").eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("orders").select("id,order_reference,customer_id,bespoke_request_id,style_id,style_code,style_name,style_image,garment_category,fabric_details,colour_details,preferences,measurements_snapshot,accepted_request_snapshot,status,total_amount_minor,target_completion_date,production_stage_updated_at,special_instructions,lock_version,created_at,updated_at").eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("appointments").select(APPOINTMENT_COLUMNS).eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("wardrobe_items").select("*").eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("concierge_requests").select(CONCIERGE_COLUMNS).eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("appointment_change_requests").select(APPOINTMENT_CHANGE_COLUMNS).eq("customer_id", userId).order("created_at", { ascending: false }),
      supabase.from("lifecycle_events").select("id,entity_type,entity_id,event_type,actor_type,actor_id,metadata,created_at").eq("customer_id", userId).in("entity_type", ["bespoke_request", "order"]).order("created_at", { ascending: true }),
    ]);

    // Concierge pages load paginated safe RPC projections, never raw staff identity.
    const queryError = results.find((result) => result.error)?.error;
    if (queryError) {
      console.error("Account data query failed", queryError);
      if (isDemoMode) {
        setData(SAMPLE_DEMO_DATA);
        setIsLoading(false);
        return;
      }
      setData(EMPTY_DATA);
      setError("We could not load your private account data. Please try again.");
      setIsLoading(false);
      return;
    }

    const timelineByEntity = new Map<string, WorkflowEvent[]>();
    for (const row of results[9].data ?? []) {
      if (!row.entity_id) continue;
      timelineByEntity.set(row.entity_id, [
        ...(timelineByEntity.get(row.entity_id) ?? []),
        mapWorkflowEvent(row),
      ]);
    }

    const requestRows = (results[1].data ?? []) as Row[];
    const orderRows = (results[2].data ?? []) as Row[];
    const cataloguePaths = [...new Set([
      ...requestRows.map((row) => catalogueSnapshotPath(row.style_image_snapshot)),
      ...orderRows.map((row) => catalogueSnapshotPath(row.accepted_request_snapshot?.style_image_snapshot)),
    ].filter((path): path is string => Boolean(path)))];
    const signedImageByPath = new Map<string, string>();
    if (cataloguePaths.length > 0) {
      const { data: signedImages, error: signedImageError } = await supabase.storage
        .from("catalogue-media")
        .createSignedUrls(cataloguePaths, 60 * 60);
      if (signedImageError) {
        console.error("Historical catalogue image signing failed", signedImageError);
      } else {
        for (const image of signedImages ?? []) {
          if (image.path && image.signedUrl) signedImageByPath.set(image.path, image.signedUrl);
        }
      }
    }

    setData({
      measurements: (results[0].data ?? []).map(mapMeasurement),
      requests: requestRows.map((row) => {
        const request = mapRequest(row, timelineByEntity.get(row.id) ?? []);
        const path = catalogueSnapshotPath(row.style_image_snapshot);
        return path ? { ...request, styleImage: signedImageByPath.get(path) ?? request.styleImage } : request;
      }),
      orders: orderRows.map((row) => {
        const order = mapOrder(row, timelineByEntity.get(row.id) ?? []);
        const path = catalogueSnapshotPath(row.accepted_request_snapshot?.style_image_snapshot);
        return path ? { ...order, styleImage: signedImageByPath.get(path) ?? order.styleImage } : order;
      }),
      appointments: (results[3].data ?? []).map(mapAppointment),
      notifications: (results[4].data ?? []).map(mapNotification),
      payments: (results[5].data ?? []).map(mapPayment),
      wardrobe: (results[6].data ?? []).map(mapWardrobe),
      conciergeRequests: (results[7].data ?? []).map(mapConciergeRequest),
      conciergeMessages: [],
      appointmentChanges: (results[8].data ?? []).map(mapAppointmentChange),
    });
    setIsLoading(false);
  }, [isAuthLoading, needsAccountData, userId]);

  useEffect(() => {
    void reloadData();
  }, [reloadData, pathname]);

  const requireSuccess = <T,>(result: { ok: true; data: T } | { ok: false; error: string }) => {
    if (!result.ok) throw new Error(result.error);
    return result.data;
  };

  const saveMeasurementProfile = async (
    measurements: Record<string, number>,
    unit: "cm" | "inches",
    fitPreference?: "tailored" | "regular" | "relaxed",
    notes?: string
  ) => {
    requireSuccess(await saveMeasurementProfileAction({ measurements, unit, fitPreference, notes }));
    await reloadData();
  };

  const addBespokeRequest = async (payload: BespokeRequestPayload) => {
    const saved = requireSuccess(await submitBespokeRequestAction(payload));
    await reloadData();
    return saved;
  };

  const markNotificationAsRead = async (id: string) => {
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("id", id);
    if (updateError) throw new Error("We could not update that notification.");
    setData((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt } : item
      ),
    }));
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) throw new Error("Sign in to update notifications.");
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("customer_id", user.id);
    if (updateError) throw new Error("We could not update your notifications.");
    setData((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, isRead: true, readAt })),
    }));
  };

  const value: AccountDataContextValue = {
      ...data,
      data,
      isLoading,
      error,
      currentMeasurement: data.measurements.find((measurement) => measurement.isCurrent),
      measurementHistory: data.measurements,
      unreadNotificationsCount: data.notifications.filter((notification) => !notification.isRead).length,
      reloadData,
      saveMeasurementProfile,
      addBespokeRequest,
      markNotificationAsRead,
      markAllNotificationsAsRead,
  };

  return createElement(AccountDataContext.Provider, { value }, children);
}

export function useAccountData() {
  const context = useContext(AccountDataContext);
  if (!context) throw new Error("useAccountData must be used within AccountDataProvider");
  return context;
}
