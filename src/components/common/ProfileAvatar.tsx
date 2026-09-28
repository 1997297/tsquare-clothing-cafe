"use client";

import Image from "next/image";
import { getProfileAvatarUrl } from "@/lib/profile-avatar";
import { cn } from "@/lib/utils";

interface ProfileAvatarIdentity {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

interface ProfileAvatarProps {
  profile: ProfileAvatarIdentity | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function ProfileAvatar({ profile, className, imageClassName, priority = false }: ProfileAvatarProps) {
  const imageUrl = getProfileAvatarUrl(profile?.avatarUrl ?? undefined);
  const firstName = profile?.firstName?.trim();
  const lastName = profile?.lastName?.trim();
  const initials = `${firstName?.charAt(0) || "T"}${lastName?.charAt(0) || "C"}`;
  const accessibleName = [firstName, lastName].filter(Boolean).join(" ") || "TCC account";

  return (
    <span
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-champagne/40 bg-champagne/15 font-display text-xs font-bold tracking-wider text-champagne shadow-inner",
        className
      )}
      aria-label={imageUrl ? `${accessibleName} profile picture` : `${accessibleName} profile initials`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="96px"
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
