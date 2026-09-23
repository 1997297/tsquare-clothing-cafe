"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/lib/auth-context";
import { UserPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function CreateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/account";

  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    preferredContact: "whatsapp" as "whatsapp" | "phone" | "email",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error, requiresVerification } = await signUp({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        preferredContact: formData.preferredContact,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to create account. Please check your information.");
      } else if (requiresVerification) {
        setVerificationRequired(true);
      } else {
        router.push(nextUrl);
      }
    } catch {
      setErrorMsg("A connection error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8 selection:bg-champagne selection:text-near-black">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <BrandLogo variant="light" size="lg" />
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold mt-4 block">
            Private Client Membership
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory mt-2 font-normal">
            Create Your Client Account
          </h1>
          <p className="mt-2 text-xs text-stone-400 font-light">
            Begin an enduring sartorial relationship with our Abeokuta tailoring house.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {verificationRequired ? (
          <div className="p-8 bg-[#151513] fine-border rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-10 w-10 text-champagne mx-auto" />
            <h3 className="font-display text-xl text-warm-ivory">
              Confirmation Dispatch Sent
            </h3>
            <p className="text-xs text-stone-300 font-light leading-relaxed">
              We have dispatched a verification link to{" "}
              <span className="font-mono text-warm-ivory">{formData.email}</span>. Please click the link to activate your Private Client account.
            </p>
            <div className="pt-2">
              <Button href="/auth/sign-in" variant="champagne" size="md">
                Proceed to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 bg-[#151513] fine-border rounded-3xl space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1 font-medium">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Adewale"
                  className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-3.5 py-2.5 focus:outline-none focus:border-champagne"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1 font-medium">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Adeleke"
                  className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-3.5 py-2.5 focus:outline-none focus:border-champagne"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1 font-medium">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="adewale@domain.com"
                className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-3.5 py-2.5 focus:outline-none focus:border-champagne"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1 font-medium">
                Phone / WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234 800 000 0000"
                className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-3.5 py-2.5 focus:outline-none focus:border-champagne font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                Preferred Contact Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["whatsapp", "phone", "email"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, preferredContact: method })}
                    className={cn(
                      "py-2 rounded-xl text-[11px] font-medium uppercase tracking-wider border transition-colors capitalize",
                      formData.preferredContact === method
                        ? "border-champagne bg-champagne/10 text-champagne"
                        : "border-stone-800 text-stone-400 hover:border-stone-700"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1 font-medium">
                Create Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-3.5 py-2.5 focus:outline-none focus:border-champagne"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1 font-medium">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repeat password"
                className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-3.5 py-2.5 focus:outline-none focus:border-champagne"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="champagne"
                size="lg"
                fullWidth
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Register Client Account
                  </>
                )}
              </Button>
            </div>

            <div className="pt-3 border-t border-stone-800 text-center text-xs text-stone-400">
              Already a client?{" "}
              <Link
                href={nextUrl ? `/auth/sign-in?next=${encodeURIComponent(nextUrl)}` : "/auth/sign-in"}
                className="text-champagne font-semibold hover:underline"
              >
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-near-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-champagne" />
        </div>
      }
    >
      <CreateAccountForm />
    </Suspense>
  );
}
