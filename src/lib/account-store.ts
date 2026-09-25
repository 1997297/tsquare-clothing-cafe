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
  addConciergeMessageAction,
  createConciergeRequestAction,
  requestAppointmentChangeAction,
  saveMeasurementProfileAction,
  submitBespokeRequestAction,
} from "@/app/account/actions";
import type {
  AppointmentChangeRequest,
  ConciergeCategory,
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

function mapRequest(row: Row): BespokeRequestPayload {
  const snapshot = row.measurements_snapshot ?? {};
  const references = Array.isArray(row.reference_images) ? row.reference_images : [];
  return {
    requestId: row.request_reference,
    status: row.status,
    createdAt: row.created_at,
    styleId: row.style_id ?? undefined,
    styleCode: row.style_code ?? undefined,
    styleName: row.style_name ?? undefined,
    styleImage: row.style_image ?? undefined,
    garmentCategory: row.garment_category ?? undefined,
    isIdeaPath: row.is_idea_path,
    fabric: row.fabric ?? undefined,
    colour: row.colour ?? undefined,
    preferences: { ...(row.preferences ?? {}), referenceImages: references },
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
    persistence: "database",
  };
}

function mapOrder(row: Row): CustomerOrder {
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

function mapConciergeMessage(row: Row): ConciergeMessage {
  return {
    id: row.id,
    requestId: row.request_id,
    senderType: row.sender_type,
    senderId: row.sender_id ?? undefined,
    senderName: row.sender_name,
    message: row.message,
    createdAt: row.created_at,
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
  requestAppointmentReschedule: (
    appointmentId: string,
    proposedDate: string,
    proposedTime: string,
    reason: string
  ) => Promise<void>;
  requestAppointmentCancellation: (appointmentId: string, reason: string) => Promise<void>;
  createConciergeRequest: (payload: {
    category: ConciergeCategory;
    subject: string;
    message: string;
    relatedRequestId?: string;
    relatedOrderId?: string;
    relatedAppointmentId?: string;
  }) => Promise<ConciergeRequest>;
  addConciergeMessage: (requestId: string, message: string) => Promise<ConciergeMessage>;
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
    if (!isSupabaseConfigured) {
      setData(EMPTY_DATA);
      setError(isDemoMode ? null : "Private account data is unavailable until the database is configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const results = await Promise.all([
      supabase.from("measurement_profiles").select("*").order("version", { ascending: false }),
      supabase.from("bespoke_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("wardrobe_items").select("*").order("created_at", { ascending: false }),
      supabase.from("concierge_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("concierge_messages").select("*").order("created_at", { ascending: true }),
      supabase.from("appointment_change_requests").select("*").order("created_at", { ascending: false }),
    ]);

    const queryError = results.find((result) => result.error)?.error;
    if (queryError) {
      console.error("Account data query failed", queryError);
      setData(EMPTY_DATA);
      setError("We could not load your private account data. Please try again.");
      setIsLoading(false);
      return;
    }

    setData({
      measurements: (results[0].data ?? []).map(mapMeasurement),
      requests: (results[1].data ?? []).map(mapRequest),
      orders: (results[2].data ?? []).map(mapOrder),
      appointments: (results[3].data ?? []).map(mapAppointment),
      notifications: (results[4].data ?? []).map(mapNotification),
      payments: (results[5].data ?? []).map(mapPayment),
      wardrobe: (results[6].data ?? []).map(mapWardrobe),
      conciergeRequests: (results[7].data ?? []).map(mapConciergeRequest),
      conciergeMessages: (results[8].data ?? []).map(mapConciergeMessage),
      appointmentChanges: (results[9].data ?? []).map(mapAppointmentChange),
    });
    setIsLoading(false);
  }, [isAuthLoading, needsAccountData, userId]);

  useEffect(() => {
    void reloadData();
  }, [reloadData]);

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

  const requestAppointmentReschedule = async (
    appointmentId: string,
    proposedDate: string,
    proposedTime: string,
    reason: string
  ) => {
    requireSuccess(
      await requestAppointmentChangeAction({
        appointmentId,
        changeType: "reschedule",
        proposedDate,
        proposedTime,
        reason,
      })
    );
    await reloadData();
  };

  const requestAppointmentCancellation = async (appointmentId: string, reason: string) => {
    requireSuccess(
      await requestAppointmentChangeAction({ appointmentId, changeType: "cancellation", reason })
    );
    await reloadData();
  };

  const createConciergeRequest = async (payload: {
    category: ConciergeCategory;
    subject: string;
    message: string;
    relatedRequestId?: string;
    relatedOrderId?: string;
    relatedAppointmentId?: string;
  }) => {
    const created = mapConciergeRequest(requireSuccess(await createConciergeRequestAction(payload)) as Row);
    await reloadData();
    return created;
  };

  const addConciergeMessage = async (requestId: string, message: string) => {
    const created = mapConciergeMessage(
      requireSuccess(await addConciergeMessageAction(requestId, message)) as Row
    );
    await reloadData();
    return created;
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
      requestAppointmentReschedule,
      requestAppointmentCancellation,
      createConciergeRequest,
      addConciergeMessage,
  };

  return createElement(AccountDataContext.Provider, { value }, children);
}

export function useAccountData() {
  const context = useContext(AccountDataContext);
  if (!context) throw new Error("useAccountData must be used within AccountDataProvider");
  return context;
}
