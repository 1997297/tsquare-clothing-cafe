"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { BespokeConfiguration, ContactInfo } from "@/types/bespoke";

interface ContactStepProps {
  config: BespokeConfiguration;
  onUpdate: (contact: ContactInfo) => void;
  onContinue: () => void;
  onBack: () => void;
}

const CONTACT_METHODS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
] as const;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

export function ContactStep({
  config,
  onUpdate,
  onContinue,
  onBack,
}: ContactStepProps) {
  const { user, profile } = useAuth();
  const contact = config.contact;
  const [touched, setTouched] = useState<Partial<Record<keyof ContactInfo, boolean>>>({});

  // Auto-fill authenticated profile credentials
  useEffect(() => {
    if (profile) {
      const updated = { ...contact };
      let changed = false;
      if (!contact.firstName && profile.firstName) {
        updated.firstName = profile.firstName;
        changed = true;
      }
      if (!contact.lastName && profile.lastName) {
        updated.lastName = profile.lastName;
        changed = true;
      }
      if (!contact.email && profile.email) {
        updated.email = profile.email;
        changed = true;
      }
      if (!contact.phone && profile.phone) {
        updated.phone = profile.phone;
        changed = true;
      }
      if (!contact.preferredContact && profile.preferredContact) {
        updated.preferredContact = profile.preferredContact;
        changed = true;
      }
      if (changed) {
        onUpdate(updated);
      }
    }
  }, [profile, contact, onUpdate]);

  function set<K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) {
    onUpdate({ ...contact, [key]: value });
  }

  function touch(key: keyof ContactInfo) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  const errors = {
    firstName: !contact.firstName.trim() ? "First name is required" : "",
    lastName: !contact.lastName.trim() ? "Last name is required" : "",
    email: !contact.email.trim()
      ? "Email address is required"
      : !isValidEmail(contact.email)
      ? "Enter a valid email address"
      : "",
    phone: !contact.phone.trim()
      ? "Phone number is required"
      : !isValidPhone(contact.phone)
      ? "Enter a valid phone number (minimum 10 digits)"
      : "",
    preferredContact: !contact.preferredContact ? "Choose a preferred contact method" : "",
  };

  const hasErrors = Object.values(errors).some((e) => e !== "");

  function handleContinue() {
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      preferredContact: true,
    });
    if (!hasErrors) onContinue();
  }

  function Field({
    id,
    label,
    type = "text",
    value,
    fieldKey,
    placeholder,
    autoComplete,
  }: {
    id: string;
    label: string;
    type?: string;
    value: string;
    fieldKey: keyof ContactInfo;
    placeholder?: string;
    autoComplete?: string;
  }) {
    const err = touched[fieldKey] ? errors[fieldKey] : "";
    return (
      <div>
        <label htmlFor={id} className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">
          {label}
        </label>
        <input
          id={id}
          name={fieldKey}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => set(fieldKey, e.target.value as ContactInfo[typeof fieldKey])}
          onBlur={() => touch(fieldKey)}
          className={cn(
            "w-full bg-stone-950 border rounded-xl text-sm text-warm-ivory placeholder:text-stone-700 px-4 py-3 focus:outline-none transition-colors",
            err
              ? "border-amber-700/60 focus:border-amber-500/60"
              : "border-stone-800 focus:border-champagne/50"
          )}
        />
        {err && <p className="text-[10px] text-amber-500 mt-1.5">{err}</p>}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        10 / Contact
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        How do we reach you?
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-8">
        Your details are used exclusively to review and respond to your bespoke request.
      </p>

      {/* Authenticated Client Banner or Sign in prompt */}
      {user || profile ? (
        <div className="flex items-center gap-3 mb-8 p-4 bg-stone-900/60 border border-champagne/30 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-champagne shrink-0" />
          <div className="text-xs">
            <span className="text-warm-ivory font-medium">
              Verified Private Client: {profile?.firstName} {profile?.lastName}
            </span>
            <p className="text-stone-400 text-[11px]">
              Profile credentials auto-applied. This bespoke request will permanently bind to your client account.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-8 p-4 bg-stone-900/40 border border-stone-800/60 rounded-xl">
          <span className="text-xs text-stone-500">Already a client?</span>
          <Link
            href="/auth/sign-in"
            className="text-xs text-champagne hover:text-champagne-light underline underline-offset-2 transition-colors"
          >
            Sign in to link to your account
          </Link>
        </div>
      )}

      <div className="space-y-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            id="contact-firstname"
            label="First Name"
            value={contact.firstName}
            fieldKey="firstName"
            placeholder="Adewale"
            autoComplete="given-name"
          />
          <Field
            id="contact-lastname"
            label="Last Name"
            value={contact.lastName}
            fieldKey="lastName"
            placeholder="Okonkwo"
            autoComplete="family-name"
          />
        </div>
        <Field
          id="contact-phone"
          label="Phone Number"
          type="tel"
          value={contact.phone}
          fieldKey="phone"
          placeholder="+234 800 000 0000"
          autoComplete="tel"
        />
        <Field
          id="contact-email"
          label="Email Address"
          type="email"
          value={contact.email}
          fieldKey="email"
          placeholder="your@email.com"
          autoComplete="email"
        />

        {/* Preferred contact */}
        <fieldset>
          <legend className="text-[10px] uppercase tracking-widest text-stone-500 mb-3">
            Preferred Contact Method
          </legend>
          <div className="flex flex-wrap gap-3">
            {CONTACT_METHODS.map((m) => {
              const isSelected = contact.preferredContact === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => { set("preferredContact", m.id); touch("preferredContact"); }}
                  className={cn(
                    "px-5 py-2.5 rounded-xl border text-xs transition-all duration-150",
                    isSelected
                      ? "border-champagne/60 bg-stone-900/80 text-champagne"
                      : "border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          {touched.preferredContact && errors.preferredContact && (
            <p className="text-[10px] text-amber-500 mt-2">{errors.preferredContact}</p>
          )}
        </fieldset>
      </div>

      <p className="text-[10px] text-stone-600 mb-8 leading-relaxed">
        Your information is handled with complete discretion and used solely to process your bespoke commission request.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3.5 text-xs uppercase tracking-widest text-stone-400 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-2xl transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl bg-champagne text-near-black hover:bg-champagne-light transition-all duration-200"
        >
          Review My Request
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
