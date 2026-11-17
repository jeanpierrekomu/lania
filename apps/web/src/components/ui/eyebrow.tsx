import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Etiqueta pequeña sobre un título («Tu informe de diagnóstico»). */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent-ink",
        className,
      )}
      {...props}
    />
  );
}
