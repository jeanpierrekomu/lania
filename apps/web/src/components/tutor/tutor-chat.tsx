"use client";

import { Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ApiError, type Schemas } from "@/lib/api/client";
import {
  useCreateConversation,
  useHealth,
  useLatestTutorConversation,
  useMe,
  useSendTutorMessage,
} from "@/lib/api/queries";
import { TUTOR_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

import { LaniaMascot } from "@/components/mascot/lania-mascot";

type Conversation = Schemas["TutorConversationOut"];
type Message = Schemas["TutorMessageOut"];

/** Chat con la tutora. Lania es una IA (lo decimos siempre) y no cambia notas ni claves. */
export function TutorChat() {
  const params = useSearchParams();
  const evaluationId = params.get("evaluation");
  const health = useHealth();
  const latest = useLatestTutorConversation();
  const create = useCreateConversation();
  const [created, setCreated] = useState<Conversation | null>(null);
  const started = useRef(false);
  // Sin «explícame este error», se continúa la última conversación general.
  const conversation = created ?? (!evaluationId ? (latest.data ?? null) : null);

  useEffect(() => {
    if (started.current || conversation || latest.isPending || !health.data?.ai_available) return;
    if (evaluationId || (latest.isSuccess && !latest.data)) {
      started.current = true;
      create.mutate(evaluationId ? { evaluation_id: evaluationId } : {}, { onSuccess: setCreated });
    }
  }, [evaluationId, latest.data, latest.isPending, latest.isSuccess, health.data, conversation, create]);

  if (health.data && !health.data.ai_available) {
    return (
      <Card className="flex flex-col gap-3">
        <CardTitle>{TUTOR_NAME} todavía no está disponible aquí</CardTitle>
        <p>
          La tutora con IA necesita un proveedor configurado en el servidor (por ejemplo, un modelo local con Ollama o
          una API). No simulamos respuestas: preferimos decírtelo.
        </p>
        <p className="text-sm text-ink-muted">Mientras tanto, tus clases, repasos y el diagnóstico funcionan con normalidad.</p>
      </Card>
    );
  }
  if (create.isError) return <ErrorState message={create.error.message} onRetry={() => create.reset()} />;
  if (!conversation) return <LoadingState label={`Llamando a ${TUTOR_NAME}…`} />;
  return <ChatView initial={conversation} />;
}

function ChatView({ initial }: { initial: Conversation }) {
  const [messages, setMessages] = useState<Message[]>(initial.messages);
  const [left, setLeft] = useState(initial.daily_messages_left);
  const [text, setText] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const messageId = useRef<string>(crypto.randomUUID());
  const send = useSendTutorMessage(initial.id);
  const endRef = useRef<HTMLDivElement>(null);
  const showAvatar = useMe().data?.preferences.show_avatar ?? true;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pendingText]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = (pendingText ?? text).trim();
    if (!value || send.isPending) return;
    setPendingText(value);
    setText("");
    send.mutate(
      { client_message_id: messageId.current, text: value },
      {
        onSuccess: (turn) => {
          setMessages((m) => [...m, turn.user_message, turn.reply]);
          setLeft(turn.daily_messages_left);
          setPendingText(null);
          messageId.current = crypto.randomUUID();
        },
      },
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const err = send.error instanceof ApiError ? send.error : null;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight">
          {showAvatar && <LaniaMascot pose="speaking" size={44} />}
          {TUTOR_NAME}
        </h1>
        <p className="text-sm text-ink-muted">
          Tutora con IA, no una persona. Corrige como máximo 2 errores por mensaje y puede equivocarse. Te quedan {left}{" "}
          mensajes hoy.
        </p>
        {initial.context_title_es && (
          <p className="mt-2 rounded-2xl bg-primary-soft p-3 text-sm" lang="en">
            <span lang="es-419" className="font-semibold">
              Conversando sobre:{" "}
            </span>
            {initial.context_title_es.replace(/^Tu respuesta en: /, "")}
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-3" aria-label="Conversación" aria-live="polite">
        {messages.length === 0 && !pendingText && (
          <li className="rounded-[var(--radius-card)] bg-primary-soft p-4">
            Escríbele en inglés o en español: una duda de gramática, una frase que quieras decir mejor o «quiero
            practicar una entrevista».
          </li>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} showAvatar={showAvatar} />
        ))}
        {pendingText && (
          <>
            <li className="self-end rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-ink">{pendingText}</li>
            {send.isPending && (
              <li role="status" className="self-start rounded-2xl bg-surface-2 px-4 py-3 text-ink-muted">
                {TUTOR_NAME} está escribiendo…
              </li>
            )}
          </>
        )}
      </ol>
      <div ref={endRef} />

      {err && (
        <ErrorState
          message={err.message}
          onRetry={err.retryable ? () => submit() : undefined}
        />
      )}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="tutor-input" className="sr-only">
          Mensaje para {TUTOR_NAME}
        </label>
        <textarea
          id="tutor-input"
          rows={3}
          maxLength={1000}
          value={pendingText && !send.isError ? "" : text}
          disabled={send.isPending || left === 0}
          onChange={(e) => {
            setPendingText(null);
            setText(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder={left === 0 ? "Llegaste al límite de hoy" : "Escribe aquí… (Enter envía, Shift+Enter nueva línea)"}
          className="w-full rounded-2xl border-2 border-border bg-surface p-4 outline-none focus:border-primary disabled:opacity-60"
        />
        <div>
          <Button type="submit" disabled={send.isPending || left === 0 || !(text.trim() || pendingText)}>
            <Send aria-hidden /> Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ message, showAvatar }: { message: Message; showAvatar: boolean }) {
  const mine = message.role === "user";
  return (
    <li className={cn("flex max-w-[90%] items-end gap-2", mine ? "self-end" : "self-start")}>
      {!mine && showAvatar && (
        <LaniaMascot pose={message.corrections.length > 0 ? "correcting" : "explaining"} size={36} decorative />
      )}
      <div
        className={cn(
          "flex flex-col gap-2 rounded-2xl px-4 py-3 whitespace-pre-line",
          mine ? "rounded-br-sm bg-primary text-primary-ink" : "rounded-bl-sm border border-border bg-surface shadow-card",
        )}
      >
      <span className="sr-only">{mine ? "Tú:" : `${TUTOR_NAME}:`}</span>
      {message.text}
      {message.corrections.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-border pt-2 text-sm">
          {message.corrections.map((c) => (
            <li key={`${c.original}-${c.corrected}`}>
              <span lang="en">
                <del className="decoration-error">{c.original}</del> → <strong>{c.corrected}</strong>
              </span>
              <span className="block text-ink-muted">{c.explanation_es}</span>
            </li>
          ))}
        </ul>
      )}
      </div>
    </li>
  );
}
