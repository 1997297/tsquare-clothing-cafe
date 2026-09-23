"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/account";

  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(error.message || "Invalid email or password. Please verify your credentials.");
      } else {
        router.push(nextUrl);
      }
    } catch {
      setErrorMsg("An unexpected connection issue occurred. Please try again.");
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
            Private Client Portal
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory mt-2 font-normal">
            Sign In to Your Account
          </h1>
          <p className="mt-2 text-xs text-stone-400 font-light">
            Access your measurement archives, fitting dates, and bespoke commissions.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 bg-[#151513] fine-border rounded-3xl space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
              Client Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@domain.com"
              className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[10px] uppercase font-mono tracking-wider text-champagne hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In As Private Client
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-stone-800 text-center text-xs text-stone-400">
            New to TSquare Clothing Cafe?{" "}
            <Link
              href={nextUrl ? `/auth/create-account?next=${encodeURIComponent(nextUrl)}` : "/auth/create-account"}
              className="text-champagne font-semibold hover:underline"
            >
              Create an Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-near-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-champagne" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
