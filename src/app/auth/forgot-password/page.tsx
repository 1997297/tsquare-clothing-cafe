"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, CheckCircle2, KeyRound, AlertCircle, Loader2 } from "lucide-react";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(() =>
    searchParams.get("error") === "invalid_or_expired"
      ? "That recovery link is invalid or has expired. Request a new one below."
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setErrorMsg(error.message || "Unable to dispatch reset instructions. Please try again.");
      } else {
        setSubmitted(true);
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
            Account Recovery
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory mt-2 font-normal">
            Reset Your Password
          </h1>
          <p className="mt-2 text-xs text-stone-400 font-light">
            Enter your registered client email to receive secure recovery instructions.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {submitted ? (
          <div className="p-8 bg-stone-950 fine-border rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-10 w-10 text-champagne mx-auto" />
            <h3 className="font-display text-xl text-warm-ivory">
              Recovery Dispatch Sent
            </h3>
            <p className="text-xs text-stone-300 font-light leading-relaxed">
              If an active client profile exists for <span className="font-mono text-warm-ivory">{email}</span>, a secure password reset link has been dispatched to your inbox.
            </p>
            <div className="pt-2">
              <Button href="/auth/sign-in" variant="champagne" size="md">
                Return to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 bg-stone-950 fine-border rounded-3xl space-y-5">
            <div>
              <label htmlFor="recovery-email" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                Client Email Address
              </label>
              <input
                type="email"
                id="recovery-email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne transition-colors"
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
                    Dispatching Link...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Dispatch Reset Instructions
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t border-stone-800 text-center text-xs text-stone-400">
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center text-stone-400 hover:text-champagne transition-colors"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-near-black grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-champagne" /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
