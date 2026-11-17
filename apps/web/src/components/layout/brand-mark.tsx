import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Logo oficial de LANIA (mismo archivo que usa el diseño: public/brand/lania-wordmark.png). */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagen estática pequeña; no necesita optimización
    <img
      src="/brand/lania-wordmark.png"
      alt={APP_NAME}
      width={842}
      height={249}
      className={cn("block h-8 w-auto select-none", className)}
    />
  );
}
