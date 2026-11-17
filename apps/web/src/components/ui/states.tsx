import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "./button";

/** Estados funcionales: nunca pantallas vacías ni datos inventados (spec §5.4). */
export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-ink-muted">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-error-soft p-5 text-ink">
      <p className="flex items-center gap-2 font-semibold text-error">
        <AlertTriangle className="size-5" aria-hidden /> Algo no salió bien
      </p>
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Intentar de nuevo
        </Button>
      )}
    </div>
  );
}
