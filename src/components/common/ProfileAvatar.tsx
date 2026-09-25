"use client";

import Image from "next/image";
import type { CustomerProfile } from "@/types";
import { getProfileAvatarUrl } from "@/lib/profile-avatar";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  profile: CustomerProfile | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function ProfileAvatar({ profile, className, imageClassName, priority = false }: ProfileAvatarProps) {
  const imageUrl = getProfileAvatarUrl(profile?.avatarUrl);
  const initials = `${profile?.firstName?.charAt(0) || "P"}${profile?.lastName?.charAt(0) || "C"}`;

  return (
    <span
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-champagne/40 bg-champagne/15 font-display text-xs font-bold tracking-wider text-champagne shadow-inner",
        className
      )}
      aria-label={imageUrl ? `${profile?.firstName || "Client"} profile picture` : `${initials} profile initials`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="80px"
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
