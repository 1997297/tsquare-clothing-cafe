export type ProductCategory = 
  | "agbada"
  | "senator"
  | "kaftan"
  | "traditional"
  | "bespoke"
  | "formal";

export interface Style {
  id: string;
  slug: string;
  code: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  description: string;
  longDescription?: string;
  images: string[];
  availableColours: { name: string; hex: string }[];
  fabricInformation: string;
  fitInformation: string;
  occasions: string[];
  featured: boolean;
  collection: string;
  tags: string[];
  leadTimeWeeks?: number;
  craftsmanshipHighlights?: string[];
}

export interface Collection {
  id: string;
  slug: ProductCategory;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  featuredQuote: string;
  characteristics: string[];
}

export type AppointmentType =
  | "consultation"
  | "measurement"
  | "first-fitting"
  | "final-fitting"
  | "pickup";

export interface Appointment {
  id: string;
  appointmentType: AppointmentType;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  isExistingCustomer: boolean;
  styleReference?: string;
  notes?: string;
  createdAt: string;
  status: "pending_confirmation" | "confirmed" | "completed" | "cancelled";
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
}

export interface SavedLook {
  styleId: string;
  addedAt: string;
}

/**
 * Phase 3 Private Client Platform Types
 */
export interface User {
  id: string;
  email: string;
  role: "visitor" | "customer" | "admin" | "staff";
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: "whatsapp" | "phone" | "email";
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MeasurementVerificationStatus =
  | "customer_entered"
  | "needs_confirmation"
  | "tsquare_verified"
  | "measured_by_tsquare";

export interface CustomerMeasurementRecord {
  id: string;
  customerId: string;
  version: number;
  isCurrent: boolean;
  unit: "cm" | "inches";
  fitPreference?: "tailored" | "regular" | "relaxed";
  verificationStatus: MeasurementVerificationStatus;
  measurements: Record<string, number>;
  notes?: string;
  createdAt: string;
}

export type CustomerOrderStatus =
  | "order_confirmed"
  | "measurements_confirmed"
  | "in_production"
  | "finishing"
  | "ready"
  | "completed";

export interface CustomerOrder {
  id: string;
  orderReference: string;
  customerId: string;
  bespokeRequestId?: string;
  styleId: string;
  styleCode: string;
  styleName: string;
  garmentCategory?: ProductCategory;
  fabricDetails?: {
    name: string;
    description?: string;
    finish?: string;
  };
  colourDetails?: {
    name: string;
    hex: string;
  };
  preferences?: Record<string, any>;
  measurementsSnapshot: Record<string, number>;
  status: CustomerOrderStatus;
  totalAmount?: number;
  targetCompletionDate?: string;
  productionStageUpdatedAt?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CustomerAppointmentStatus =
  | "requested"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled";

export interface CustomerAppointment {
  id: string;
  customerId: string;
  bespokeRequestId?: string;
  orderId?: string;
  type: string;
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  status: CustomerAppointmentStatus;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationType =
  | "request_received"
  | "request_update"
  | "needs_clarification"
  | "pricing_ready"
  | "order_confirmed"
  | "production_update"
  | "order_ready"
  | "appointment_confirmed";

export interface CustomerNotification {
  id: string;
  customerId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: "request" | "order" | "appointment";
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
