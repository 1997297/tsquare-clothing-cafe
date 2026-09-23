"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { PasswordInput } from "@/components/common/PasswordInput";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMsg(error.message || "Failed to update password. Your reset link may have expired.");
      } else {
        setSuccess(true);
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
            Security Vault
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory mt-2 font-normal">
            Set Your New Password
          </h1>
          <p className="mt-2 text-xs text-stone-400 font-light">
            Enter and confirm your updated private client password.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {success ? (
          <div className="p-8 bg-[#151513] fine-border rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-10 w-10 text-champagne mx-auto" />
            <h3 className="font-display text-xl text-warm-ivory">
              Password Successfully Updated
            </h3>
            <p className="text-xs text-stone-300 font-light leading-relaxed">
              Your security credentials have been updated. You can now access your Private Client portal.
            </p>
            <div className="pt-2">
              <Button href="/account" variant="champagne" size="md">
                Go to Client Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 bg-[#151513] fine-border rounded-3xl space-y-5">
            <div>
              <label htmlFor="reset-password" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                New Password *
              </label>
              <PasswordInput
                id="reset-password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne transition-colors"
              />
            </div>

            <div>
              <label htmlFor="reset-confirm-password" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                Confirm New Password *
              </label>
              <PasswordInput
                id="reset-confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                visibilityLabel="confirm password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
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
                    Updating Security...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Confirm New Password
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t border-stone-800 text-center text-xs text-stone-400">
              <Link
                href="/auth/sign-in"
                className="text-stone-400 hover:text-champagne transition-colors"
              >
                Cancel and return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
