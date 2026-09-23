"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import { supabase, isSupabaseConfigured } from "./supabase/client";
import {
  CustomerMeasurementRecord,
  CustomerOrder,
  CustomerAppointment,
  CustomerNotification,
  PaymentRecord,
  PaymentType,
  WardrobeItem,
  ConciergeRequest,
  ConciergeCategory,
  ConciergeMessage,
  AppointmentChangeRequest,
} from "@/types";
import { BespokeRequestPayload } from "@/types/bespoke";

const STORAGE_ACCOUNT_DATA = "tcc_client_account_data_v2";

interface AccountData {
  measurements: CustomerMeasurementRecord[];
  requests: BespokeRequestPayload[];
  orders: CustomerOrder[];
  appointments: CustomerAppointment[];
  notifications: CustomerNotification[];
  savedStyleIds: string[];
  payments: PaymentRecord[];
  wardrobe: WardrobeItem[];
  conciergeRequests: ConciergeRequest[];
  conciergeMessages: ConciergeMessage[];
  appointmentChanges: AppointmentChangeRequest[];
}

// Initial sample data for demonstration if user has empty account
const defaultSampleOrder: CustomerOrder = {
  id: "ord-tcc-0842",
  orderReference: "TCC-ORD-0842",
  customerId: "client-default",
  styleId: "tsq-agbada-024",
  styleCode: "TSQ AGBADA 024",
  styleName: "Imperial Grand Agbada 4-Piece",
  garmentCategory: "agbada",
  fabricDetails: {
    name: "Premium Wool Blend & Heritage Silk",
    finish: "Matte ceremonial",
  },
  colourDetails: {
    name: "Midnight Black with Antique Gold Needlework",
    hex: "#11110F",
  },
  measurementsSnapshot: {
    neck: 42,
    shoulder: 48,
    chest: 104,
    sleeveLength: 88,
    topLength: 140,
    trouserWaist: 86,
    hip: 102,
    trouserLength: 105,
  },
  status: "in_production",
  targetCompletionDate: "2026-10-18",
  productionStageUpdatedAt: "2026-09-21T10:00:00Z",
  specialInstructions: "Intricate traditional geometric embroidery across chest plate. Hand-folded fila cap included.",
  createdAt: "2026-09-12T14:30:00Z",
};

const defaultSampleAppointment: CustomerAppointment = {
  id: "apt-1092",
  customerId: "client-default",
  orderId: "ord-tcc-0842",
  type: "first-fitting",
  preferredDate: "2026-10-02",
  preferredTime: "11:30 AM",
  confirmedDate: "2026-10-02",
  confirmedTime: "11:30 AM",
  status: "confirmed",
  location: "TCC office",
  notes: "First basted fitting of raw wool canvas for shoulder pitch & chest drape.",
  createdAt: "2026-09-14T09:00:00Z",
};

const defaultSampleMeasurement: CustomerMeasurementRecord = {
  id: "meas-init-01",
  customerId: "client-default",
  version: 1,
  isCurrent: true,
  unit: "cm",
  fitPreference: "tailored",
  verificationStatus: "tsquare_verified",
  measurements: {
    neck: 42,
    shoulder: 48,
    chest: 104,
    sleeveLength: 88,
    bicep: 36,
    wrist: 19,
    stomach: 92,
    waist: 86,
    topLength: 140,
    trouserWaist: 86,
    hip: 102,
    thigh: 60,
    knee: 42,
    trouserLength: 105,
    ankle: 38,
  },
  notes: "Master tailor balance check completed at the TCC office.",
  createdAt: "2026-09-08T11:00:00Z",
};

const defaultSampleNotifications: CustomerNotification[] = [
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
  {
    id: "notif-02",
    customerId: "client-default",
    type: "appointment_confirmed",
    title: "First Fitting Checkpoint Confirmed",
    message: "Your fitting session on 2 October at 11:30 AM has been reserved in our VIP Salon Suite.",
    relatedEntityType: "appointment",
    relatedEntityId: "apt-1092",
    isRead: true,
    readAt: "2026-09-16T12:00:00Z",
    createdAt: "2026-09-15T16:30:00Z",
  },
];

const defaultSamplePayments: PaymentRecord[] = [
  {
    id: "pay-01",
    orderId: "ord-tcc-0842",
    customerId: "client-default",
    amount: 100000,
    currency: "NGN",
    type: "deposit",
    provider: "sandbox",
    providerReference: "SANDBOX_TCC-PAY-260921-DEP",
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
    provider: "sandbox",
    providerReference: "SANDBOX_TCC-PAY-260928-INS",
    internalReference: "TCC-PAY-260928-INS",
    status: "successful",
    paidAt: "2026-09-28T14:30:00Z",
    metadata: { note: "Canvas Completion Milestone Installment" },
    createdAt: "2026-09-28T14:30:00Z",
  },
];

const defaultSampleWardrobe: WardrobeItem[] = [
  {
    id: "wrd-01",
    customerId: "client-default",
    orderId: "ord-prev-0419",
    styleId: "tsq-senator-012",
    styleCode: "TSQ SENATOR 012",
    styleName: "Asymmetric Placket Senator 2-Piece",
    category: "senator",
    heroImage: "/images/styles/tcc_senator_executive_1790045211676.jpg",
    fabricSnapshot: {
      name: "Italian Super 140s Tropical Wool",
      finish: "Subtle sheen",
      weight: "260 GSM",
    },
    colourSnapshot: {
      name: "Obsidian Black with Gold Hardware",
      hex: "#161614",
    },
    preferencesSnapshot: {
      trouserCut: "Tapered with side adjusters",
      collarStyle: "Mandarin standing collar",
      cuffStyle: "French cuff with handcrafted cufflinks",
    },
    measurementsSnapshot: {
      neck: 42,
      shoulder: 48,
      chest: 104,
      sleeveLength: 88,
      topLength: 95,
      trouserWaist: 86,
      hip: 102,
      trouserLength: 105,
    },
    occasion: "State Executive Dinner",
    completionDate: "2026-08-15",
    craftsmanshipNotes: "Hand-mitered placket closure with concealed antique brass snap buttons. Pressed with natural lavender steam finish.",
    createdAt: "2026-08-15T16:00:00Z",
  },
];

const defaultSampleConciergeRequests: ConciergeRequest[] = [
  {
    id: "conc-01",
    referenceCode: "TCC-CONC-8821",
    customerId: "client-default",
    category: "fitting_enquiry",
    subject: "Shoulder Drape & Fila Cap Coordination",
    message: "I would like to verify that the hand-folded fila cap will match the antique gold needlework of the agbada chest plate for my fitting.",
    relatedOrderId: "ord-tcc-0842",
    status: "in_review",
    createdAt: "2026-09-22T08:30:00Z",
    updatedAt: "2026-09-22T10:15:00Z",
  },
];

const defaultSampleConciergeMessages: ConciergeMessage[] = [
  {
    id: "msg-01",
    requestId: "conc-01",
    senderType: "customer",
    senderName: "Client",
    message: "I would like to verify that the hand-folded fila cap will match the antique gold needlework of the agbada chest plate for my fitting.",
    createdAt: "2026-09-22T08:30:00Z",
  },
  {
    id: "msg-02",
    requestId: "conc-01",
    senderType: "concierge",
    senderName: "TSquare Atelier Concierge",
    message: "Good day. We have confirmed with our master embroiderer that the fila cap uses the identical metallic antique gold thread spool from the same dye lot. It will be prepped in your VIP Salon Suite for your October fitting.",
    createdAt: "2026-09-22T10:15:00Z",
  },
];

function getStoredAccountData(): AccountData {
  if (typeof window === "undefined") {
    return {
      measurements: [defaultSampleMeasurement],
      requests: [],
      orders: [defaultSampleOrder],
      appointments: [defaultSampleAppointment],
      notifications: defaultSampleNotifications,
      savedStyleIds: ["tsq-agbada-024", "tsq-senator-012"],
      payments: defaultSamplePayments,
      wardrobe: defaultSampleWardrobe,
      conciergeRequests: defaultSampleConciergeRequests,
      conciergeMessages: defaultSampleConciergeMessages,
      appointmentChanges: [],
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNT_DATA);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }

  // Also check if any bespoke submissions exist from Phase 2
  let localRequests: BespokeRequestPayload[] = [];
  try {
    const subRaw = localStorage.getItem("tcc_bespoke_submissions_v1");
    if (subRaw) localRequests = JSON.parse(subRaw);
  } catch {
    // ignore
  }

  const initial: AccountData = {
    measurements: [defaultSampleMeasurement],
    requests: localRequests,
    orders: [defaultSampleOrder],
    appointments: [defaultSampleAppointment],
    notifications: defaultSampleNotifications,
    savedStyleIds: ["tsq-agbada-024", "tsq-senator-012"],
    payments: defaultSamplePayments,
    wardrobe: defaultSampleWardrobe,
    conciergeRequests: defaultSampleConciergeRequests,
    conciergeMessages: defaultSampleConciergeMessages,
    appointmentChanges: [],
  };

  try {
    localStorage.setItem(STORAGE_ACCOUNT_DATA, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveStoredAccountData(data: AccountData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_ACCOUNT_DATA, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("tcc:account_data_changed", { detail: data }));
  } catch (err) {
    console.error("Failed to save local account data:", err);
  }
}

export function useAccountData() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<AccountData>(getStoredAccountData);
  const [isLoading, setIsLoading] = useState(false);

  const reloadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    if (isSupabaseConfigured) {
      try {
        const [
          { data: dbMeasurements },
          { data: dbRequests },
          { data: dbOrders },
          { data: dbAppointments },
          { data: dbNotifications },
          { data: dbSavedStyles },
          { data: dbPayments },
          { data: dbWardrobe },
          { data: dbConciergeRequests },
          { data: dbConciergeMessages },
        ] = await Promise.all([
          supabase
            .from("measurement_profiles")
            .select("*")
            .eq("customer_id", user.id)
            .order("version", { ascending: false }),
          supabase
            .from("bespoke_requests")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("orders")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("appointments")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("notifications")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("saved_styles")
            .select("style_id")
            .eq("customer_id", user.id),
          supabase
            .from("payments")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("wardrobe_items")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("concierge_requests")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("concierge_messages")
            .select("*")
            .order("created_at", { ascending: true }),
        ]);

        if (dbMeasurements || dbRequests || dbOrders) {
          const fallbackData = getStoredAccountData();
          setData({
            measurements: (dbMeasurements || []).map((m: any) => ({
              id: m.id,
              customerId: m.customer_id,
              version: m.version,
              isCurrent: m.is_current,
              unit: m.unit,
              fitPreference: m.fit_preference,
              verificationStatus: m.verification_status,
              measurements: m.measurements,
              notes: m.notes,
              createdAt: m.created_at,
            })),
            requests: (dbRequests || []).map((r: any) => ({
              requestId: r.request_reference,
              status: r.status,
              createdAt: r.created_at,
              styleId: r.style_id,
              styleCode: r.style_code,
              styleName: r.style_name,
              garmentCategory: r.garment_category,
              isIdeaPath: r.is_idea_path,
              fabric: r.fabric,
              colour: r.colour,
              preferences: r.preferences,
              fitPreference: r.fit_preference,
              measurements: r.measurements_snapshot,
              measurementConfidence: r.measurement_confidence,
              occasion: r.occasion,
              eventName: r.event_name,
              eventDate: r.event_date,
              requiredDate: r.required_date,
              appointmentRequest: r.appointment_request,
              contact: r.contact_info,
            })),
            orders: (dbOrders || []).map((o: any) => ({
              id: o.id,
              orderReference: o.order_reference,
              customerId: o.customer_id,
              bespokeRequestId: o.bespoke_request_id,
              styleId: o.style_id,
              styleCode: o.style_code,
              styleName: o.style_name,
              garmentCategory: o.garment_category,
              fabricDetails: o.fabric_details,
              colourDetails: o.colour_details,
              preferences: o.preferences,
              measurementsSnapshot: o.measurements_snapshot,
              status: o.status,
              totalAmount: o.total_amount,
              targetCompletionDate: o.target_completion_date,
              productionStageUpdatedAt: o.production_stage_updated_at,
              specialInstructions: o.special_instructions,
              createdAt: o.created_at,
              updatedAt: o.updated_at,
            })),
            appointments: (dbAppointments || []).map((a: any) => ({
              id: a.id,
              customerId: a.customer_id,
              bespokeRequestId: a.bespoke_request_id,
              orderId: a.order_id,
              type: a.type,
              preferredDate: a.preferred_date,
              preferredTime: a.preferred_time,
              confirmedDate: a.confirmed_date,
              confirmedTime: a.confirmed_time,
              status: a.status,
              location: a.location,
              notes: a.notes,
              createdAt: a.created_at,
              updatedAt: a.updated_at,
            })),
            notifications: (dbNotifications || []).map((n: any) => ({
              id: n.id,
              customerId: n.customer_id,
              type: n.type,
              title: n.title,
              message: n.message,
              relatedEntityType: n.related_entity_type,
              relatedEntityId: n.related_entity_id,
              isRead: n.is_read,
              readAt: n.read_at,
              createdAt: n.created_at,
            })),
            savedStyleIds: (dbSavedStyles || []).map((s: any) => s.style_id),
            payments: dbPayments && dbPayments.length > 0
              ? dbPayments.map((p: any) => ({
                  id: p.id,
                  orderId: p.order_id,
                  customerId: p.customer_id,
                  amount: Number(p.amount),
                  currency: p.currency,
                  type: p.type,
                  provider: p.provider,
                  providerReference: p.provider_reference,
                  internalReference: p.internal_reference,
                  status: p.status,
                  paidAt: p.paid_at,
                  metadata: p.metadata,
                  createdAt: p.created_at,
                  updatedAt: p.updated_at,
                }))
              : fallbackData.payments,
            wardrobe: dbWardrobe && dbWardrobe.length > 0
              ? dbWardrobe.map((w: any) => ({
                  id: w.id,
                  customerId: w.customer_id,
                  orderId: w.order_id,
                  styleId: w.style_id,
                  styleCode: w.style_code,
                  styleName: w.style_name,
                  category: w.category,
                  heroImage: w.hero_image,
                  galleryImages: w.gallery_images,
                  fabricSnapshot: w.fabric_snapshot,
                  colourSnapshot: w.colour_snapshot,
                  preferencesSnapshot: w.preferences_snapshot,
                  measurementsSnapshot: w.measurements_snapshot,
                  occasion: w.occasion,
                  completionDate: w.completion_date,
                  craftsmanshipNotes: w.craftsmanship_notes,
                  createdAt: w.created_at,
                }))
              : fallbackData.wardrobe,
            conciergeRequests: dbConciergeRequests && dbConciergeRequests.length > 0
              ? dbConciergeRequests.map((c: any) => ({
                  id: c.id,
                  referenceCode: c.reference_code,
                  customerId: c.customer_id,
                  category: c.category,
                  subject: c.subject,
                  message: c.message,
                  relatedRequestId: c.related_request_id,
                  relatedOrderId: c.related_order_id,
                  relatedAppointmentId: c.related_appointment_id,
                  status: c.status,
                  createdAt: c.created_at,
                  updatedAt: c.updated_at,
                }))
              : fallbackData.conciergeRequests,
            conciergeMessages: dbConciergeMessages && dbConciergeMessages.length > 0
              ? dbConciergeMessages.map((m: any) => ({
                  id: m.id,
                  requestId: m.request_id,
                  senderType: m.sender_type,
                  senderId: m.sender_id,
                  senderName: m.sender_name,
                  message: m.message,
                  createdAt: m.created_at,
                }))
              : fallbackData.conciergeMessages,
            appointmentChanges: fallbackData.appointmentChanges,
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error loading account data from Supabase:", err);
      }
    }

    // Fallback local load
    setData(getStoredAccountData());
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    reloadData();

    const handleStorageChange = () => {
      setData(getStoredAccountData());
    };

    window.addEventListener("tcc:account_data_changed", handleStorageChange);
    return () => {
      window.removeEventListener("tcc:account_data_changed", handleStorageChange);
    };
  }, [reloadData]);

  // Current measurement profile
  const currentMeasurement = data.measurements.find((m) => m.isCurrent) || data.measurements[0];

  // Save new measurement version (NEVER overwriting history)
  const saveMeasurementProfile = async (
    measurements: Record<string, number>,
    unit: "cm" | "inches",
    fitPreference?: "tailored" | "regular" | "relaxed",
    notes?: string
  ) => {
    const nextVersion = (data.measurements[0]?.version || 0) + 1;
    const newRecord: CustomerMeasurementRecord = {
      id: "meas-" + Date.now(),
      customerId: user?.id || profile?.id || "client-default",
      version: nextVersion,
      isCurrent: true,
      unit,
      fitPreference,
      verificationStatus: "customer_entered",
      measurements,
      notes: notes || "Updated by client via Private Portal",
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        // Demote previous current measurements
        await supabase
          .from("measurement_profiles")
          .update({ is_current: false })
          .eq("customer_id", user.id);

        // Insert new current version
        await supabase.from("measurement_profiles").insert({
          customer_id: user.id,
          version: nextVersion,
          is_current: true,
          unit,
          fit_preference: fitPreference,
          verification_status: "customer_entered",
          measurements,
          notes: newRecord.notes,
        });
      } catch (err) {
        console.error("Error persisting measurement version in Supabase:", err);
      }
    }

    // Update local state and history
    const updatedHistory = [
      newRecord,
      ...data.measurements.map((m) => ({ ...m, isCurrent: false })),
    ];
    const updatedData = { ...data, measurements: updatedHistory };
    saveStoredAccountData(updatedData);
    setData(updatedData);
  };

  // Add new bespoke request
  const addBespokeRequest = async (payload: BespokeRequestPayload) => {
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("bespoke_requests").insert({
          request_reference: payload.requestId,
          customer_id: user.id,
          style_id: payload.styleId,
          style_code: payload.styleCode,
          style_name: payload.styleName,
          garment_category: payload.garmentCategory,
          is_idea_path: payload.isIdeaPath,
          fabric: payload.fabric,
          colour: payload.colour,
          preferences: payload.preferences,
          fit_preference: payload.fitPreference,
          measurements_snapshot: payload.measurements,
          measurement_confidence: payload.measurementConfidence,
          occasion: payload.occasion,
          event_name: payload.eventName,
          event_date: payload.eventDate,
          required_date: payload.requiredDate,
          appointment_request: payload.appointmentRequest,
          special_instructions: payload.preferences?.specialInstructions,
          contact_info: payload.contact,
          status: "submitted",
        });

        // Also create requested appointment if one was included
        if (payload.appointmentRequest?.type && payload.appointmentRequest.type !== "none") {
          await supabase.from("appointments").insert({
            customer_id: user.id,
            type: payload.appointmentRequest.type,
            preferred_date: payload.appointmentRequest.preferredDate || new Date().toISOString().split("T")[0],
            preferred_time: payload.appointmentRequest.preferredTime || "morning",
            status: "requested",
            notes: payload.appointmentRequest.notes,
          });
        }
      } catch (err) {
        console.error("Error saving request to Supabase:", err);
      }
    }

    const updatedRequests = [payload, ...data.requests.filter((r) => r.requestId !== payload.requestId)];
    let updatedAppointments = [...data.appointments];

    if (payload.appointmentRequest?.type && payload.appointmentRequest.type !== "none") {
      const newAppt: CustomerAppointment = {
        id: "apt-" + Date.now(),
        customerId: user?.id || "client-default",
        type: payload.appointmentRequest.type,
        preferredDate: payload.appointmentRequest.preferredDate || new Date().toISOString().split("T")[0],
        preferredTime: payload.appointmentRequest.preferredTime || "Morning",
        status: "requested",
        location: "TCC office",
        notes: payload.appointmentRequest.notes,
        createdAt: new Date().toISOString(),
      };
      updatedAppointments.unshift(newAppt);
    }

    const updatedData = { ...data, requests: updatedRequests, appointments: updatedAppointments };
    saveStoredAccountData(updatedData);
    setData(updatedData);
  };

  // Mark notification as read
  const markNotificationAsRead = async (id: string) => {
    if (isSupabaseConfigured && user) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
    }
    const updated = data.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    );
    const updatedData = { ...data, notifications: updated };
    saveStoredAccountData(updatedData);
    setData(updatedData);
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (isSupabaseConfigured && user) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("customer_id", user.id);
    }
    const updated = data.notifications.map((n) => ({
      ...n,
      isRead: true,
      readAt: new Date().toISOString(),
    }));
    const updatedData = { ...data, notifications: updated };
    saveStoredAccountData(updatedData);
    setData(updatedData);
  };

  // Phase 4: Record a verified payment
  const recordPayment = async (payload: {
    orderId: string;
    amount: number;
    type: PaymentType;
    provider?: "paystack" | "flutterwave" | "manual_transfer" | "atelier_terminal" | "sandbox";
    metadata?: Record<string, any>;
  }) => {
    const internalRef = `TCC-PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newPayment: PaymentRecord = {
      id: "pay-" + Date.now(),
      orderId: payload.orderId,
      customerId: user?.id || profile?.id || "client-default",
      amount: Math.round(payload.amount),
      currency: "NGN",
      type: payload.type,
      provider: payload.provider || "sandbox",
      providerReference: `SANDBOX_${internalRef}`,
      internalReference: internalRef,
      status: "successful",
      paidAt: new Date().toISOString(),
      metadata: payload.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("payments").insert({
          order_id: newPayment.orderId,
          customer_id: user.id,
          amount: newPayment.amount,
          currency: newPayment.currency,
          type: newPayment.type,
          provider: newPayment.provider,
          provider_reference: newPayment.providerReference,
          internal_reference: newPayment.internalReference,
          status: newPayment.status,
          paid_at: newPayment.paidAt,
          metadata: newPayment.metadata,
        });
      } catch (err) {
        console.error("Error saving payment to Supabase:", err);
      }
    }

    const targetOrder = data.orders.find((o) => o.id === payload.orderId);
    const orderRef = targetOrder ? targetOrder.orderReference : "Bespoke Order";

    const newNotification: CustomerNotification = {
      id: "notif-pay-" + Date.now(),
      customerId: user?.id || "client-default",
      type: "payment_successful",
      title: "Payment Recorded",
      message: `₦${payload.amount.toLocaleString()} confirmed towards ${orderRef} (${payload.type.replace(/_/g, " ")}).`,
      relatedEntityType: "order",
      relatedEntityId: payload.orderId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [newPayment, ...data.payments];
    const updatedNotifications = [newNotification, ...data.notifications];
    const updatedData = { ...data, payments: updatedPayments, notifications: updatedNotifications };

    saveStoredAccountData(updatedData);
    setData(updatedData);
    return newPayment;
  };

  // Phase 4: Idempotently sync a completed order into My TSquare Wardrobe
  const syncCompletedOrderToWardrobe = async (orderId: string) => {
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    // Idempotency check: verify not already recorded
    const existing = data.wardrobe.find((w) => w.orderId === orderId);
    if (existing) return existing;

    const newWardrobeItem: WardrobeItem = {
      id: "wrd-" + Date.now(),
      customerId: user?.id || profile?.id || "client-default",
      orderId: order.id,
      styleId: order.styleId,
      styleCode: order.styleCode,
      styleName: order.styleName,
      category: order.garmentCategory || "agbada",
      heroImage: "/images/styles/tcc_agbada_imperial_1790045070682.jpg",
      fabricSnapshot: order.fabricDetails || { name: "Artisanal Heritage Fabric" },
      colourSnapshot: order.colourDetails || { name: "Bespoke Palette", hex: "#11110F" },
      preferencesSnapshot: order.preferences || {},
      measurementsSnapshot: order.measurementsSnapshot || {},
      occasion: "Atelier Commission",
      completionDate: new Date().toISOString().split("T")[0],
      craftsmanshipNotes: order.specialInstructions || "Master cutter handcrafted finish.",
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("wardrobe_items").insert({
          customer_id: user.id,
          order_id: newWardrobeItem.orderId,
          style_id: newWardrobeItem.styleId,
          style_code: newWardrobeItem.styleCode,
          style_name: newWardrobeItem.styleName,
          category: newWardrobeItem.category,
          hero_image: newWardrobeItem.heroImage,
          fabric_snapshot: newWardrobeItem.fabricSnapshot,
          colour_snapshot: newWardrobeItem.colourSnapshot,
          preferences_snapshot: newWardrobeItem.preferencesSnapshot,
          measurements_snapshot: newWardrobeItem.measurementsSnapshot,
          occasion: newWardrobeItem.occasion,
          completion_date: newWardrobeItem.completionDate,
          craftsmanship_notes: newWardrobeItem.craftsmanshipNotes,
        });
      } catch (err) {
        console.error("Error creating wardrobe item in Supabase:", err);
      }
    }

    const newNotification: CustomerNotification = {
      id: "notif-wrd-" + Date.now(),
      customerId: user?.id || "client-default",
      type: "wardrobe_item_added",
      title: "Garment Added to Your Wardrobe",
      message: `${order.styleName} is now permanently recorded in your private digital wardrobe.`,
      relatedEntityType: "wardrobe",
      relatedEntityId: newWardrobeItem.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedWardrobe = [newWardrobeItem, ...data.wardrobe];
    const updatedNotifications = [newNotification, ...data.notifications];
    const updatedData = { ...data, wardrobe: updatedWardrobe, notifications: updatedNotifications };

    saveStoredAccountData(updatedData);
    setData(updatedData);
    return newWardrobeItem;
  };

  // Phase 4: Non-destructive appointment reschedule request
  const requestAppointmentReschedule = async (
    appointmentId: string,
    proposedDate: string,
    proposedTime: string,
    reason: string
  ) => {
    const changeReq: AppointmentChangeRequest = {
      id: "chg-" + Date.now(),
      appointmentId,
      customerId: user?.id || "client-default",
      changeType: "reschedule",
      proposedDate,
      proposedTime,
      reason,
      status: "pending_review",
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("appointment_change_requests").insert({
          appointment_id: appointmentId,
          customer_id: user.id,
          change_type: "reschedule",
          proposed_date: proposedDate,
          proposed_time: proposedTime,
          reason,
          status: "pending_review",
        });
      } catch (err) {
        console.error("Error logging reschedule request in Supabase:", err);
      }
    }

    const target = data.appointments.find((a) => a.id === appointmentId);
    const newNotification: CustomerNotification = {
      id: "notif-resched-" + Date.now(),
      customerId: user?.id || "client-default",
      type: "request_update",
      title: "Reschedule Request Transmitted",
      message: `Your request to move your ${target?.type || "fitting"} session to ${proposedDate} (${proposedTime}) is with our concierge.`,
      relatedEntityType: "appointment",
      relatedEntityId: appointmentId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedChanges = [changeReq, ...data.appointmentChanges];
    const updatedNotifications = [newNotification, ...data.notifications];
    const updatedData = {
      ...data,
      appointmentChanges: updatedChanges,
      notifications: updatedNotifications,
    };

    saveStoredAccountData(updatedData);
    setData(updatedData);
    return changeReq;
  };

  // Phase 4: Non-destructive appointment cancellation request
  const requestAppointmentCancellation = async (appointmentId: string, reason: string) => {
    const changeReq: AppointmentChangeRequest = {
      id: "chg-" + Date.now(),
      appointmentId,
      customerId: user?.id || "client-default",
      changeType: "cancellation",
      reason,
      status: "pending_review",
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("appointment_change_requests").insert({
          appointment_id: appointmentId,
          customer_id: user.id,
          change_type: "cancellation",
          reason,
          status: "pending_review",
        });
      } catch (err) {
        console.error("Error logging cancellation request in Supabase:", err);
      }
    }

    const target = data.appointments.find((a) => a.id === appointmentId);
    const newNotification: CustomerNotification = {
      id: "notif-cancel-" + Date.now(),
      customerId: user?.id || "client-default",
      type: "request_update",
      title: "Cancellation Request Received",
      message: `Your cancellation request for ${target?.type || "fitting"} appointment has been noted by our concierge team.`,
      relatedEntityType: "appointment",
      relatedEntityId: appointmentId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedChanges = [changeReq, ...data.appointmentChanges];
    const updatedNotifications = [newNotification, ...data.notifications];
    const updatedData = {
      ...data,
      appointmentChanges: updatedChanges,
      notifications: updatedNotifications,
    };

    saveStoredAccountData(updatedData);
    setData(updatedData);
    return changeReq;
  };

  // Phase 4: Create TSquare Concierge request
  const createConciergeRequest = async (payload: {
    category: ConciergeCategory;
    subject: string;
    message: string;
    relatedRequestId?: string;
    relatedOrderId?: string;
    relatedAppointmentId?: string;
  }) => {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceCode = `TCC-CONC-${Date.now().toString().slice(-4)}-${rand}`;
    const newReqId = "conc-" + Date.now();

    const newRequest: ConciergeRequest = {
      id: newReqId,
      referenceCode,
      customerId: user?.id || profile?.id || "client-default",
      category: payload.category,
      subject: payload.subject,
      message: payload.message,
      relatedRequestId: payload.relatedRequestId,
      relatedOrderId: payload.relatedOrderId,
      relatedAppointmentId: payload.relatedAppointmentId,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialMessage: ConciergeMessage = {
      id: "msg-" + Date.now(),
      requestId: newReqId,
      senderType: "customer",
      senderId: user?.id,
      senderName: profile?.firstName || "Client",
      message: payload.message,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("concierge_requests").insert({
          id: newReqId,
          reference_code: referenceCode,
          customer_id: user.id,
          category: payload.category,
          subject: payload.subject,
          message: payload.message,
          related_request_id: payload.relatedRequestId,
          related_order_id: payload.relatedOrderId,
          related_appointment_id: payload.relatedAppointmentId,
          status: "open",
        });
        await supabase.from("concierge_messages").insert({
          request_id: newReqId,
          sender_type: "customer",
          sender_id: user.id,
          sender_name: profile?.firstName || "Client",
          message: payload.message,
        });
      } catch (err) {
        console.error("Error creating concierge request in Supabase:", err);
      }
    }

    const newNotification: CustomerNotification = {
      id: "notif-conc-" + Date.now(),
      customerId: user?.id || "client-default",
      type: "concierge_response",
      title: "Concierge Request Received",
      message: `Your inquiry "${payload.subject}" has been assigned to your private client concierge.`,
      relatedEntityType: "concierge",
      relatedEntityId: newReqId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedRequests = [newRequest, ...data.conciergeRequests];
    const updatedMessages = [...data.conciergeMessages, initialMessage];
    const updatedNotifications = [newNotification, ...data.notifications];
    const updatedData = {
      ...data,
      conciergeRequests: updatedRequests,
      conciergeMessages: updatedMessages,
      notifications: updatedNotifications,
    };

    saveStoredAccountData(updatedData);
    setData(updatedData);
    return newRequest;
  };

  // Phase 4: Append message to open Concierge thread
  const addConciergeMessage = async (requestId: string, messageText: string) => {
    const newMsg: ConciergeMessage = {
      id: "msg-" + Date.now(),
      requestId,
      senderType: "customer",
      senderId: user?.id,
      senderName: profile?.firstName || "Client",
      message: messageText,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("concierge_messages").insert({
          request_id: requestId,
          sender_type: "customer",
          sender_id: user.id,
          sender_name: profile?.firstName || "Client",
          message: messageText,
        });
      } catch (err) {
        console.error("Error adding message to Supabase:", err);
      }
    }

    const updatedMessages = [...data.conciergeMessages, newMsg];
    const updatedData = { ...data, conciergeMessages: updatedMessages };

    saveStoredAccountData(updatedData);
    setData(updatedData);
    return newMsg;
  };

  // Phase 4: Accept quoted price and establish confirmed order
  const acceptBespokeQuoteAndConvertToOrder = async (requestId: string) => {
    const targetReq = data.requests.find((r) => r.requestId === requestId);
    if (!targetReq) return null;

    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const orderRef = `TCC-ORD-${orderNum}`;
    const quotedAmount = 320000; // Authoritative Atelier quote

    const newOrder: CustomerOrder = {
      id: "ord-tcc-" + orderNum,
      orderReference: orderRef,
      customerId: user?.id || profile?.id || "client-default",
      bespokeRequestId: targetReq.requestId,
      styleId: targetReq.styleId || "tsq-custom",
      styleCode: targetReq.styleCode || "TSQ BESPOKE",
      styleName: targetReq.styleName || "Bespoke Sartorial Commission",
      garmentCategory: targetReq.garmentCategory,
      fabricDetails: targetReq.fabric
        ? { name: targetReq.fabric.name, finish: targetReq.fabric.finish }
        : undefined,
      colourDetails: targetReq.colour
        ? { name: targetReq.colour.name, hex: targetReq.colour.hex }
        : undefined,
      preferences: targetReq.preferences,
      measurementsSnapshot: (targetReq.measurements as Record<string, any>) || {},
      status: "order_confirmed",
      totalAmount: quotedAmount,
      targetCompletionDate: targetReq.requiredDate || "2026-11-20",
      productionStageUpdatedAt: new Date().toISOString(),
      specialInstructions: targetReq.preferences?.specialInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from("bespoke_requests")
          .update({ status: "converted_to_order" })
          .eq("request_reference", requestId);

        await supabase.from("orders").insert({
          order_reference: newOrder.orderReference,
          customer_id: user.id,
          style_id: newOrder.styleId,
          style_code: newOrder.styleCode,
          style_name: newOrder.styleName,
          garment_category: newOrder.garmentCategory,
          fabric_details: newOrder.fabricDetails,
          colour_details: newOrder.colourDetails,
          preferences: newOrder.preferences,
          measurements_snapshot: newOrder.measurementsSnapshot,
          status: "order_confirmed",
          total_amount: newOrder.totalAmount,
          target_completion_date: newOrder.targetCompletionDate,
          special_instructions: newOrder.specialInstructions,
        });
      } catch (err) {
        console.error("Error creating confirmed order in Supabase:", err);
      }
    }

    const updatedRequests = data.requests.map((r) =>
      r.requestId === requestId ? { ...r, status: "converted_to_order" as const } : r
    );

    const newNotification: CustomerNotification = {
      id: "notif-ord-" + Date.now(),
      customerId: user?.id || "client-default",
      type: "order_confirmed",
      title: "Bespoke Order Confirmed",
      message: `Your commission ${orderRef} is officially established. Initial production deposit payment is now open.`,
      relatedEntityType: "order",
      relatedEntityId: newOrder.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedOrders = [newOrder, ...data.orders];
    const updatedNotifications = [newNotification, ...data.notifications];
    const updatedData = {
      ...data,
      requests: updatedRequests,
      orders: updatedOrders,
      notifications: updatedNotifications,
    };

    saveStoredAccountData(updatedData);
    setData(updatedData);
    return newOrder;
  };

  return {
    data,
    isLoading,
    currentMeasurement,
    measurementHistory: data.measurements,
    requests: data.requests,
    orders: data.orders,
    appointments: data.appointments,
    notifications: data.notifications,
    payments: data.payments,
    wardrobe: data.wardrobe,
    conciergeRequests: data.conciergeRequests,
    conciergeMessages: data.conciergeMessages,
    appointmentChanges: data.appointmentChanges,
    unreadNotificationsCount: data.notifications.filter((n) => !n.isRead).length,
    saveMeasurementProfile,
    addBespokeRequest,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    recordPayment,
    syncCompletedOrderToWardrobe,
    requestAppointmentReschedule,
    requestAppointmentCancellation,
    createConciergeRequest,
    addConciergeMessage,
    acceptBespokeQuoteAndConvertToOrder,
    reloadData,
  };
}
