import Image from "next/image";
import type { ReactNode } from "react";

import { TUTOR_NAME } from "@/lib/brand";
import { mascotSrc, type MascotPose } from "@/lib/mascot";
import { cn } from "@/lib/utils";

/**
 * Lania, la tortuguita (registro en `lib/mascot.ts`).
 *
 * - `avatar`: cabeza en un círculo, junto a mensajes y saludos.
 * - `scene`: cuerpo completo con fondo transparente; respeta su proporción (`object-contain`).
 * - `decorative`: el texto de al lado ya la nombra → `alt=""` y oculta al lector de pantalla.
 */
export function LaniaMascot({
  pose,
  size,
  variant = "avatar",
  decorative = false,
  priority = false,
  className,
}: {
  pose: MascotPose;
  size: number;
  variant?: "avatar" | "scene";
  decorative?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={mascotSrc(pose, variant)}
      alt={decorative ? "" : `${TUTOR_NAME}, tutora con IA`}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "shrink-0",
        variant === "avatar" ? "rounded-full bg-surface object-cover ring-2 ring-brand-sky" : "object-contain",
        className,
      )}
    />
  );
}

/** «Lania dice…»: la tortuguita con un bocadillo, como en las guías de marca. */
export function LaniaSays({
  pose,
  children,
  showAvatar = true,
  size = 64,
  className,
}: {
  pose: MascotPose;
  children: ReactNode;
  showAvatar?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      {showAvatar && <LaniaMascot pose={pose} size={size} decorative />}
      <div className="relative flex-1 rounded-[var(--radius-card)] rounded-bl-md border border-border bg-surface px-5 py-4 shadow-card">
        <span className="sr-only">{TUTOR_NAME}: </span>
        {children}
      </div>
    </div>
  );
}
