"use client";

import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { useDeleteAccount, useExportMyData } from "@/lib/api/queries";
import { signOutEverywhere } from "@/lib/auth/supabase";

const CONFIRM_WORD = "BORRAR";

/** Derechos sobre tus datos (docs/security/privacy.md): descargar todo y borrar la cuenta. */
export function PrivacySection() {
  const router = useRouter();
  const exportData = useExportMyData();
  const deleteAccount = useDeleteAccount();
  const [confirm, setConfirm] = useState("");

  async function download() {
    const data = await exportData.mutateAsync();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "mis-datos-lania.json" });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove() {
    await deleteAccount.mutateAsync();
    await signOutEverywhere();
    router.replace("/");
  }

  return (
    <section aria-labelledby="privacy-title" className="flex flex-col gap-4 rounded-3xl border-2 border-border p-5">
      <div>
        <h2 id="privacy-title" className="font-display text-lg font-bold">
          Tus datos
        </h2>
        <p className="text-sm text-ink-muted">
          Puedes descargar todo lo que guardamos de ti o borrar tu cuenta cuando quieras. Las conversaciones con Lania
          se borran solas a los 90 días.
        </p>
      </div>
      <div>
        <Button type="button" variant="secondary" onClick={() => void download()} disabled={exportData.isPending}>
          <Download aria-hidden /> {exportData.isPending ? "Preparando…" : "Descargar mis datos"}
        </Button>
        {exportData.isError && <ErrorState message={exportData.error.message} />}
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <label htmlFor="confirm-delete" className="text-sm">
          Para borrar tu cuenta y todo tu progreso escribe <strong>{CONFIRM_WORD}</strong>. No se puede deshacer.
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="confirm-delete"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            className="min-h-12 rounded-2xl border-2 border-border bg-surface px-4 focus:border-primary"
          />
          <Button
            type="button"
            variant="secondary"
            className="text-error"
            disabled={confirm.trim().toUpperCase() !== CONFIRM_WORD || deleteAccount.isPending}
            onClick={() => void remove()}
          >
            <Trash2 aria-hidden /> {deleteAccount.isPending ? "Borrando…" : "Borrar mi cuenta"}
          </Button>
        </div>
        {deleteAccount.isError && <ErrorState message={deleteAccount.error.message} />}
      </div>
    </section>
  );
}
