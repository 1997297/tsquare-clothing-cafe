"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { User, CheckCircle2, AlertCircle, Save, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountProfilePage() {
  const { profile, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [preferredContact, setPreferredContact] = useState<"whatsapp" | "phone" | "email">(
    profile?.preferredContact || "whatsapp"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSaving(true);
    setSuccessMsg(false);

    const { error } = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      preferredContact,
    });

    setIsSaving(false);
    if (error) {
      setErrorMsg(error.message || "Failed to save profile changes.");
    } else {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl">
      {/* Header */}
      <div className="border-b border-stone-800/60 pb-6">
        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
          Client Credentials
        </span>
        <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
          Personal Profile
        </h1>
        <p className="text-xs text-stone-400 mt-1 font-light">
          Manage your contact credentials and direct communication channel for bespoke consultations.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile credentials successfully updated across your digital client account.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
              First Name *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-3 focus:outline-none focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-3 focus:outline-none focus:border-champagne"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
            Registered Email Address
          </label>
          <input
            type="email"
            disabled
            value={profile?.email || ""}
            className="w-full bg-stone-900/50 border border-stone-800 rounded-xl text-xs text-stone-500 px-4 py-3 cursor-not-allowed font-mono"
          />
          <p className="text-[10px] text-stone-500 mt-1">
            Email is permanently linked to your private client authentication.
          </p>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
            Phone / WhatsApp Number *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-3 focus:outline-none focus:border-champagne font-mono"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-2">
            Preferred Atelier Contact Channel
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["whatsapp", "phone", "email"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPreferredContact(method)}
                className={cn(
                  "py-2.5 rounded-xl text-xs uppercase font-mono tracking-wider border capitalize transition-colors",
                  preferredContact === method
                    ? "border-champagne bg-champagne/10 text-champagne font-bold"
                    : "border-stone-800 text-stone-400 hover:border-stone-700"
                )}
              >
                {method}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">
            Our Abeokuta bespoke concierge uses your preferred channel for fitting reminders and tailoring checkpoint notifications.
          </p>
        </div>

        <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-[10px] font-mono uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
            <span>
              Client Since{" "}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-NG", {
                    month: "long",
                    year: "numeric",
                  })
                : "2026"}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
