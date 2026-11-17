"use client";

import { MessageCircleWarning } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { useSendFeedback } from "@/lib/api/queries";
import { Modal } from "@/ui/components/ui/Modal";

const KINDS = [
  { id: "bug", label: "Algo no funcionó" },
  { id: "content", label: "Una corrección o un ejercicio está mal" },
  { id: "idea", label: "Tengo una idea" },
  { id: "other", label: "Otra cosa" },
] as const;

/** «¿Algo no funcionó?»: comentarios del piloto, con la página donde estabas (sin datos de la pantalla). */
export function FeedbackButton() {
  const pathname = usePathname() ?? "/";
  const send = useSendFeedback();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("bug");
  const [message, setMessage] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send.mutate(
      { kind, message, page: pathname.slice(0, 200) },
      {
        onSuccess: () => {
          setMessage("");
        },
      },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          send.reset();
          setOpen(true);
        }}
        className="fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-raised ring-1 ring-border hover:bg-primary-soft lg:bottom-5"
      >
        <MessageCircleWarning className="size-4" aria-hidden /> ¿Algo no funcionó?
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cuéntanos qué pasó">
        {send.isSuccess ? (
          <div role="status" className="flex flex-col gap-4">
            <p>¡Gracias! Lo leemos todo y nos ayuda muchísimo a mejorar LANIA.</p>
            <Button type="button" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-semibold">¿De qué se trata?</legend>
              {KINDS.map((k) => (
                <label key={k.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="feedback-kind"
                    checked={kind === k.id}
                    onChange={() => setKind(k.id)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {k.label}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Cuéntanos con tus palabras</span>
              <textarea
                required
                minLength={3}
                maxLength={2000}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-2xl border-2 border-border bg-surface p-3 focus:border-primary"
              />
            </label>
            <p className="text-xs text-ink-muted">Guardamos tu mensaje y la página donde estabas ({pathname}).</p>
            {send.isError && <ErrorState message={send.error.message} />}
            <Button type="submit" disabled={send.isPending || message.trim().length < 3}>
              {send.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
