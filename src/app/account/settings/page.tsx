"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Lock,
  LogOut,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
} from "lucide-react";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { signOut, updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await updatePassword(password);
    setIsUpdatingPassword(false);

    if (error) {
      setPasswordError(error.message || "Failed to update security credentials.");
    } else {
      setPasswordSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl">
      {/* Header */}
      <div className="border-b border-stone-800/60 pb-6">
        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
          Security & Privacy
        </span>
        <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
          Account Settings
        </h1>
        <p className="text-xs text-stone-400 mt-1 font-light">
          Manage your password credentials, account confidentiality, and active private client session.
        </p>
      </div>

      {passwordSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Your private client password has been successfully updated.</span>
        </div>
      )}

      {passwordError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{passwordError}</span>
        </div>
      )}

      {/* Password Management */}
      <form onSubmit={handlePasswordChange} className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-5">
        <div className="flex items-center gap-2.5 pb-2">
          <Lock className="w-4 h-4 text-champagne" />
          <h2 className="font-display text-lg text-warm-ivory">
            Update Security Credentials
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-2.5 focus:outline-none focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-2.5 focus:outline-none focus:border-champagne"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-700 hover:border-champagne text-xs uppercase font-mono tracking-wider text-warm-ivory transition-colors"
          >
            {isUpdatingPassword ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
            ) : (
              <KeyRound className="w-3.5 h-3.5 text-champagne" />
            )}
            <span>Confirm New Password</span>
          </button>
        </div>
      </form>

      {/* Confidentiality & Discretion Policy */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-3">
        <div className="flex items-center gap-2.5 text-champagne">
          <Shield className="w-4 h-4" />
          <h2 className="font-display text-base text-warm-ivory">
            Atelier Discretion & Privacy
          </h2>
        </div>
        <p className="text-xs text-stone-400 font-light leading-relaxed">
          At TSquare Clothing Cafe, all client measurements, fitting photography, and garment specifications are held under strict non-disclosure. We do not sell or expose client archives to third parties.
        </p>
      </div>

      {/* Sign Out Card */}
      <div className="p-6 rounded-3xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base text-warm-ivory">
            Active Private Client Session
          </h3>
          <p className="text-xs text-stone-500 font-light mt-0.5">
            Sign out of your account on this device.
          </p>
        </div>

        <button
          onClick={async () => {
            await signOut();
            router.push("/auth/sign-in");
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-900/60 hover:border-red-700 bg-red-950/20 text-red-300 hover:text-red-200 text-xs uppercase font-mono tracking-wider transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Salon</span>
        </button>
      </div>
    </div>
  );
}
