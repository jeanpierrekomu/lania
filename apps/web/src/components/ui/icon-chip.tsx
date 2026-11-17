import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const TONES = {
  sky: "bg-brand-sky",
  pastel: "bg-brand-sky-pastel",
  peach: "bg-brand-peach",
  lavender: "bg-brand-lavender",
  pink: "bg-brand-pink",
  yellow: "bg-brand-yellow",
} as const;

/** Icono dentro de un círculo pastel. Decorativo: el texto de al lado siempre dice lo mismo. */
export function IconChip({
  Icon,
  tone = "pastel",
  size = "md",
  className,
}: {
  Icon: LucideIcon;
  tone?: keyof typeof TONES;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-on-pastel",
        { sm: "size-8 [&_svg]:size-4", md: "size-10 [&_svg]:size-5", lg: "size-12 [&_svg]:size-6" }[size],
        TONES[tone],
        className,
      )}
    >
      <Icon />
    </span>
  );
}
