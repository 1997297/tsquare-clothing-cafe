"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
} from "lucide-react";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { getRoleLabel, type StaffRole } from "@/lib/auth/roles";
import { PROFILE_AVATAR_BUCKET } from "@/lib/profile-avatar";
import { supabase } from "@/lib/supabase/client";
import {
  updateStaffAvatarAction,
  updateStaffProfileAction,
} from "./actions";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface StaffProfileFormProps {
  profile: {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatarUrl: string | null;
    role: StaffRole;
    status: "active";
    createdAt: string;
  };
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
  note: string;
}

function ReadOnlyField({ label, value, note }: ReadOnlyFieldProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-stone-800 bg-near-black/50 px-4 py-3.5">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-warm-ivory">{value}</p>
      <p className="mt-1 text-[10px] leading-5 text-stone-500">{note}</p>
    </div>
  );
}

export function StaffProfileForm({ profile }: StaffProfileFormProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const avatarIdentity = { firstName, lastName, avatarUrl };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setIsSaving(true);

    try {
      const result = await updateStaffProfileAction({ firstName, lastName, phone });
      if (!result.ok) {
        setNotice({ type: "error", text: result.error });
        return;
      }

      setFirstName(firstName.trim());
      setLastName(lastName.trim());
      setPhone(phone.trim());
      setNotice({ type: "success", text: "Your staff profile has been updated." });
      router.refresh();
    } catch {
      setNotice({ type: "error", text: "We could not update your profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = AVATAR_EXTENSIONS[file.type];
    if (!extension) {
      setNotice({ type: "error", text: "Choose a JPEG, PNG, or WebP profile image." });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setNotice({ type: "error", text: "Profile pictures must be 5 MB or smaller." });
      return;
    }

    setNotice(null);
    setIsUploadingAvatar(true);
    const previousReference = avatarUrl;
    const objectPath = `${profile.userId}/avatar-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    let newUploadNeedsCleanup = false;

    try {
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .upload(objectPath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Staff avatar upload failed", uploadError);
        setNotice({ type: "error", text: "Profile picture upload failed. Please try again." });
        return;
      }
      newUploadNeedsCleanup = true;

      const result = await updateStaffAvatarAction(objectPath);
      if (!result.ok) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([objectPath]);
        newUploadNeedsCleanup = false;
        setNotice({ type: "error", text: result.error });
        return;
      }

      newUploadNeedsCleanup = false;
      setAvatarUrl(objectPath);
      setNotice({ type: "success", text: "Your profile picture has been updated." });
      router.refresh();

      if (
        previousReference &&
        previousReference !== objectPath &&
        previousReference.startsWith(`${profile.userId}/`)
      ) {
        const { error: cleanupError } = await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .remove([previousReference]);
        if (cleanupError) console.error("Previous staff avatar cleanup failed", cleanupError);
      }
    } catch {
      if (newUploadNeedsCleanup) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([objectPath]);
      }
      setNotice({ type: "error", text: "Profile picture upload failed. Please try again." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-800/70 pb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-champagne-dark">Staff Identity</p>
        <h1 className="mt-3 font-display text-3xl text-warm-ivory sm:text-4xl">Personal Profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">
          Maintain your personal contact details and profile picture. Staff authority is displayed here but managed separately.
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {notice ? (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={
              notice.type === "success"
                ? "flex items-start gap-3 rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-300"
                : "flex items-start gap-3 rounded-2xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-300"
            }
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="atelier-surface overflow-hidden rounded-3xl">
        <section className="flex flex-col gap-6 border-b border-stone-800 p-5 sm:flex-row sm:items-center sm:p-8">
          <ProfileAvatar profile={avatarIdentity} className="h-24 w-24 rounded-2xl text-xl" priority />
          <div className="min-w-0 space-y-3">
            <div>
              <h2 className="font-display text-xl text-warm-ivory">Profile Picture</h2>
              <p className="mt-1 max-w-xl text-xs leading-6 text-stone-400">
                Upload a JPEG, PNG, or WebP image up to 5 MB. Replacement files remain restricted to your authenticated storage folder.
              </p>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="sr-only"
              aria-label="Choose a staff profile picture"
            />
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-warm-ivory transition-colors hover:border-champagne hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne disabled:cursor-wait disabled:opacity-50"
            >
              {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {isUploadingAvatar ? "Uploading..." : avatarUrl ? "Replace Picture" : "Upload Picture"}
            </button>
          </div>
        </section>

        <div className="grid gap-8 p-5 sm:p-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
          <section aria-labelledby="staff-personal-details" className="min-w-0 space-y-5">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.22em] text-champagne-dark">
                <BadgeCheck className="h-4 w-4" />
                Editable Details
              </p>
              <h2 id="staff-personal-details" className="mt-2 font-display text-2xl text-warm-ivory">
                Personal information
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="staff-first-name" className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-stone-400">
                  First Name
                </label>
                <input
                  id="staff-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  maxLength={80}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-xl border border-stone-800 bg-near-black px-4 py-3 text-sm text-warm-ivory outline-none transition-colors focus:border-champagne focus:ring-1 focus:ring-champagne"
                />
              </div>
              <div>
                <label htmlFor="staff-last-name" className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-stone-400">
                  Last Name
                </label>
                <input
                  id="staff-last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  maxLength={80}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-xl border border-stone-800 bg-near-black px-4 py-3 text-sm text-warm-ivory outline-none transition-colors focus:border-champagne focus:ring-1 focus:ring-champagne"
                />
              </div>
            </div>

            <div>
              <label htmlFor="staff-phone" className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-stone-400">
                Phone / WhatsApp Number
              </label>
              <input
                id="staff-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                maxLength={30}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full rounded-xl border border-stone-800 bg-near-black px-4 py-3 font-mono text-sm text-warm-ivory outline-none transition-colors placeholder:text-stone-600 focus:border-champagne focus:ring-1 focus:ring-champagne"
              />
            </div>

            <div className="flex flex-col gap-4 border-t border-stone-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-[10px] leading-5 text-stone-500">
                <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" />
                Only the personal fields above are accepted by the secure update action.
              </p>
              <button
                type="submit"
                disabled={isSaving || isUploadingAvatar}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-champagne px-6 py-3 text-xs font-bold uppercase tracking-widest text-near-black transition-colors hover:bg-champagne-light focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-near-black disabled:cursor-wait disabled:opacity-50 sm:w-auto"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </section>

          <aside aria-labelledby="staff-authority" className="min-w-0 space-y-4 rounded-2xl border border-stone-800 bg-stone-950/40 p-4 sm:p-5">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.22em] text-champagne-dark">
                <ShieldCheck className="h-4 w-4" />
                Protected Authority
              </p>
              <h2 id="staff-authority" className="mt-2 font-display text-xl text-warm-ivory">Account access</h2>
              <p className="mt-2 text-xs leading-6 text-stone-500">
                These values are read-only and cannot be changed through ordinary profile editing.
              </p>
            </div>

            <ReadOnlyField label="Email" value={profile.email} note="Managed by Supabase Auth." />
            <ReadOnlyField label="Staff Role" value={getRoleLabel(profile.role)} note="Managed by trusted staff authorization." />
            <ReadOnlyField
              label="Status"
              value={profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              note="Only authorized staff management can change status."
            />

            <p className="border-t border-stone-800 pt-4 text-[9px] font-mono uppercase tracking-[0.18em] text-stone-500">
              Staff profile active since {new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))}
            </p>
          </aside>
        </div>
      </form>
    </div>
  );
}
