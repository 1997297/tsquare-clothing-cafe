"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { AppointmentType } from "@/types";
import { Button } from "@/components/common/Button";

export default function BookFittingClient() {
  const searchParams = useSearchParams();
  const prefilledStyle = searchParams.get("style") || "";

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    appointmentType: "consultation" as AppointmentType,
    date: "",
    time: "11:00 AM",
    isExistingCustomer: false,
    styleReference: prefilledStyle,
    notes: "",
  });

  useEffect(() => {
    const s = searchParams.get("style");
    if (s) {
      setFormData((prev) => ({ ...prev, styleReference: s }));
    }
  }, [searchParams]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointmentTypes: {
    type: AppointmentType;
    label: string;
    description: string;
    duration: string;
  }[] = [
    {
      type: "consultation",
      label: "Initial Sartorial Consultation",
      description:
        "Discuss silhouettes, fabric swatches, occasion dress codes, and target event timelines with a head stylist.",
      duration: "45 Minutes",
    },
    {
      type: "measurement",
      label: "28-Point Anatomical Measurement",
      description:
        "Comprehensive physiological mapping session capturing shoulder slope, chest drop, and posture for custom paper patterns.",
      duration: "30 Minutes",
    },
    {
      type: "first-fitting",
      label: "First Basted Fitting",
      description:
        "Try on your garment in raw basted cotton/canvas stage to fine-tune balance, suppression, and sleeve pitch.",
      duration: "45 Minutes",
    },
    {
      type: "final-fitting",
      label: "Final Inspection Fitting",
      description:
        "Assess completed garment, hem breaks, and collar placement prior to ceremonial hand-finishing.",
      duration: "30 Minutes",
    },
    {
      type: "pickup",
      label: "Collection & Handover",
      description:
        "Ceremonial handover in luxury garment casing and archiving into your permanent digital TSquare Wardrobe.",
      duration: "20 Minutes",
    },
  ];

  const times = [
    "09:30 AM",
    "11:00 AM",
    "01:00 PM",
    "02:30 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 600);
  };

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory pt-28 sm:pt-36 pb-24 selection:bg-champagne selection:text-near-black font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            TCC Office Reservation
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-warm-ivory">
            Book A Fitting Session
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
            Reserve dedicated one-on-one time with our master tailors. Whether beginning your first commission or attending a milestone fitting, we dedicate our full attention to your presence.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 sm:p-14 bg-[#151513] fine-border rounded-3xl text-center space-y-6 animate-in fade-in duration-300 shadow-xl">
            <CheckCircle2 className="h-16 w-16 text-champagne mx-auto" />
            <h2 className="font-display text-3xl sm:text-4xl text-warm-ivory">
              Fitting Request Logged
            </h2>

            <div className="max-w-md mx-auto p-5 bg-near-black fine-border rounded-2xl text-left text-xs space-y-2.5 text-stone-300">
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-500 uppercase tracking-wider">Client:</span>
                <span className="font-semibold text-warm-ivory">{formData.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-500 uppercase tracking-wider">Appointment:</span>
                <span className="font-semibold text-warm-ivory capitalize">
                  {formData.appointmentType.replace("-", " ")}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-500 uppercase tracking-wider">Date & Time:</span>
                <span className="font-semibold text-champagne">
                  {formData.date || "Requested Date"} at {formData.time}
                </span>
              </div>
              {formData.styleReference && (
                <div className="flex justify-between">
                  <span className="text-stone-500 uppercase tracking-wider">Style Reference:</span>
                  <span className="font-mono text-warm-ivory">{formData.styleReference}</span>
                </div>
              )}
            </div>

            {/* Architecture note for Phase 1 */}
            <div className="p-4 bg-stone-900/60 fine-border rounded-2xl max-w-lg mx-auto text-stone-400 text-xs leading-relaxed text-left flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-champagne shrink-0 mt-0.5" />
              <div>
                <strong className="text-warm-ivory block uppercase tracking-wider text-[10px] mb-0.5">
                  Phase 1 Confirmation Notice
                </strong>
                This booking submission is verified and processed through the Phase 1 interface foundation. Our TCC concierge will reach out to{" "}
                <span className="text-warm-ivory font-mono">{formData.phone}</span> via WhatsApp/phone to confirm slot availability.
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/collections" variant="champagne" size="md" className="rounded-xl">
                Explore Collections
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    customerName: "",
                    email: "",
                    phone: "",
                    appointmentType: "consultation",
                    date: "",
                    time: "11:00 AM",
                    isExistingCustomer: false,
                    styleReference: "",
                    notes: "",
                  });
                }}
                className="text-warm-ivory border-stone-700 rounded-xl"
              >
                Book Another Fitting
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-12 bg-[#151513] fine-border rounded-3xl space-y-10 shadow-xl">
            {/* 1. Appointment Type Selection */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-6 w-6 items-center justify-center bg-champagne text-near-black text-xs font-bold font-mono rounded-full">
                  1
                </span>
                <h3 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
                  Select Appointment Type *
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {appointmentTypes.map((apt) => (
                  <label
                    key={apt.type}
                    onClick={() =>
                      setFormData({ ...formData, appointmentType: apt.type })
                    }
                    className={`cursor-pointer p-4 border transition-all text-left flex flex-col justify-between rounded-2xl ${
                      formData.appointmentType === apt.type
                        ? "border-champagne bg-near-black ring-1 ring-champagne shadow-md"
                        : "border-stone-800 bg-stone-900/30 hover:border-stone-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs uppercase tracking-wider font-semibold text-warm-ivory">
                          {apt.label}
                        </span>
                        <span className="text-[9px] font-mono text-stone-500 uppercase">
                          {apt.duration}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                        {apt.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-champagne">
                      {formData.appointmentType === apt.type ? "● Selected" : "○ Select"}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Date & Time Selection */}
            <div className="pt-6 border-t border-stone-800/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-6 w-6 items-center justify-center bg-champagne text-near-black text-xs font-bold font-mono rounded-full">
                  2
                </span>
                <h3 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
                  Preferred Date & Time Slot *
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2 font-medium">
                    Requested Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block font-mono">
                    Monday to Saturday, 9:00 AM to 6:00 PM WAT
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2 font-medium">
                    Preferred Time of Day
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne"
                  >
                    {times.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Customer Information */}
            <div className="pt-6 border-t border-stone-800/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-6 w-6 items-center justify-center bg-champagne text-near-black text-xs font-bold font-mono rounded-full">
                  3
                </span>
                <h3 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
                  Your Client Details *
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    placeholder="e.g. Adebayo Adeleke"
                    className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="adebayo@example.com"
                    className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+234..."
                    className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                    Style Code / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.styleReference}
                    onChange={(e) =>
                      setFormData({ ...formData, styleReference: e.target.value })
                    }
                    placeholder="e.g. TSQ AGBADA 024"
                    className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne font-mono uppercase"
                  />
                </div>
              </div>

              {/* Existing Customer Checkbox with Rounded-xl */}
              <div className="flex items-center gap-3 p-4 bg-near-black fine-border rounded-xl">
                <input
                  type="checkbox"
                  id="existingClient"
                  checked={formData.isExistingCustomer}
                  onChange={(e) =>
                    setFormData({ ...formData, isExistingCustomer: e.target.checked })
                  }
                  className="h-4 w-4 text-champagne bg-stone-900 border-stone-700 rounded focus:ring-champagne"
                />
                <label htmlFor="existingClient" className="text-xs text-stone-300 select-none">
                  I am an existing TSquare client with my measurement profile on record at the TCC office.
                </label>
              </div>

              <div className="mt-5">
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                  Occasion, Target Date & Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Share your wedding date, specific ceremonial requirements, or fabric preferences..."
                  className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne font-sans"
                />
              </div>
            </div>

            {/* Submit with Rounded-2xl */}
            <div className="pt-4 border-t border-stone-800/80">
              <Button
                type="submit"
                variant="champagne"
                size="xl"
                disabled={isSubmitting}
                className="w-full font-bold tracking-[0.25em] rounded-2xl shadow-lg"
              >
                {isSubmitting ? (
                  "Scheduling Fitting Session..."
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Confirm Fitting Reservation
                  </>
                )}
              </Button>
              <p className="text-[10px] text-stone-500 text-center font-mono mt-3">
                No upfront booking fee • TCC office
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
