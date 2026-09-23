"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import { supabase, isSupabaseConfigured } from "./supabase/client";
import {
  CustomerMeasurementRecord,
  CustomerOrder,
  CustomerAppointment,
  CustomerNotification,
} from "@/types";
import { BespokeRequestPayload } from "@/types/bespoke";

const STORAGE_ACCOUNT_DATA = "tcc_client_account_data_v1";

interface AccountData {
  measurements: CustomerMeasurementRecord[];
  requests: BespokeRequestPayload[];
  orders: CustomerOrder[];
  appointments: CustomerAppointment[];
  notifications: CustomerNotification[];
  savedStyleIds: string[];
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

function getStoredAccountData(): AccountData {
  if (typeof window === "undefined") {
    return {
      measurements: [defaultSampleMeasurement],
      requests: [],
      orders: [defaultSampleOrder],
      appointments: [defaultSampleAppointment],
      notifications: defaultSampleNotifications,
      savedStyleIds: ["tsq-agbada-024", "tsq-senator-012"],
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
        ]);

        if (dbMeasurements || dbRequests || dbOrders) {
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

  return {
    data,
    isLoading,
    currentMeasurement,
    measurementHistory: data.measurements,
    requests: data.requests,
    orders: data.orders,
    appointments: data.appointments,
    notifications: data.notifications,
    unreadNotificationsCount: data.notifications.filter((n) => !n.isRead).length,
    saveMeasurementProfile,
    addBespokeRequest,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    reloadData,
  };
}
