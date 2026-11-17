"use client";

import { Lightbulb } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { Schemas } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Exercise = Schemas["ExerciseOut"];
export type Answer = { answer_text: string } | { option_id: string };

type Props = {
  exercise: Exercise;
  disabled?: boolean;
  hintShown?: boolean;
  onShowHint?: () => void;
  /** diagnostic = modo examen: sin pistas, botón «Siguiente» y opción «No lo sé». */
  mode?: "practice" | "diagnostic";
  onUnsure?: () => void;
  onSubmit: (answer: Answer) => void;
  /** Clave para conservar el borrador si se recarga la página (spec §5.5). */
  draftKey?: string;
};

function readDraft(key?: string) {
  if (!key) return "";
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function countWords(text: string) {
  return (text.match(/[A-Za-z']+/g) ?? []).length;
}

export function QuestionRenderer({
  exercise,
  disabled,
  hintShown = false,
  onShowHint,
  onSubmit,
  draftKey,
  mode = "practice",
  onUnsure,
}: Props) {
  const [text, setText] = useState(() => readDraft(draftKey));
  const [option, setOption] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ids = { instruction: useId(), hint: useId(), help: useId(), passage: useId() };
  const exam = mode === "diagnostic";

  useEffect(() => {
    if (!draftKey) return;
    try {
      if (text) window.sessionStorage.setItem(draftKey, text);
      else window.sessionStorage.removeItem(draftKey);
    } catch {
      /* almacenamiento no disponible: el borrador simplemente no se conserva */
    }
  }, [draftKey, text]);

  useEffect(() => {
    (inputRef.current ?? textareaRef.current)?.focus();
  }, [exercise.id]);

  const canSubmit = exercise.type === "choice" ? option !== null : text.trim().length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || disabled) return;
    onSubmit(exercise.type === "choice" ? { option_id: option! } : { answer_text: text.trim() });
  }

  const [before, after] = (exercise.sentence_en ?? "").split("___");
  const words = countWords(text);

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-describedby={ids.instruction}>
      <p id={ids.instruction} className="text-ink-muted">
        {exercise.instruction_es}
      </p>

      {exercise.passage_en && (
        <article
          aria-labelledby={ids.passage}
          className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
          lang="en"
        >
          <h3 id={ids.passage} className="mb-2 font-display text-xl font-bold">
            {exercise.passage_title_en ?? "Text"}
          </h3>
          <p className="whitespace-pre-line">{exercise.passage_en}</p>
        </article>
      )}

      {exercise.type === "open_response" ? (
        <div className="flex flex-col gap-2">
          <p className="font-display text-xl leading-snug font-semibold" lang="en">
            {exercise.task_en}
          </p>
          <label htmlFor={`answer-${exercise.id}`} className="font-semibold">
            Tu texto
          </label>
          <textarea
            ref={textareaRef}
            id={`answer-${exercise.id}`}
            lang="en"
            rows={7}
            maxLength={2000}
            spellCheck={false}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            aria-describedby={ids.help}
            className="w-full rounded-2xl border-2 border-border bg-surface p-4 text-lg outline-none focus:border-primary disabled:opacity-60"
          />
          <p id={ids.help} className="text-sm text-ink-muted" aria-live="polite">
            {words} palabra(s)
            {exercise.min_words && exercise.max_words
              ? ` · sugerido: ${exercise.min_words}–${exercise.max_words}`
              : ""}
            . Escribe con tus palabras; no usamos traductor ni corrector aquí.
          </p>
        </div>
      ) : exercise.type === "fill_blank" ? (
        <>
          <p className="font-display text-2xl leading-snug font-semibold sm:text-3xl" lang="en">
            {before}
            <span className="mx-1 inline-block min-w-16 border-b-4 border-primary align-baseline">
              <span className="sr-only" lang="es-419">
                (espacio en blanco)
              </span>
              &nbsp;
            </span>
            {after}
            {exercise.verb_hint && (
              <span className="ml-2 text-lg font-normal text-ink-muted">({exercise.verb_hint})</span>
            )}
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor={`answer-${exercise.id}`} className="font-semibold">
              Tu respuesta
            </label>
            <input
              ref={inputRef}
              id={`answer-${exercise.id}`}
              lang="en"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={300}
              value={text}
              disabled={disabled}
              onChange={(e) => setText(e.target.value)}
              aria-describedby={ids.help}
              className="min-h-13 w-full rounded-2xl border-2 border-border bg-surface px-4 text-xl outline-none focus:border-primary disabled:opacity-60"
            />
            <p id={ids.help} className="text-sm text-ink-muted">
              Puedes escribir solo lo que va en el hueco o la oración completa. Las mayúsculas no cuentan.
            </p>
          </div>
        </>
      ) : (
        <fieldset className="flex flex-col gap-3" disabled={disabled}>
          <legend className="mb-3 font-display text-2xl font-semibold" lang="en">
            {exercise.question_en}
          </legend>
          {exercise.options?.map((o) => (
            <label
              key={o.id}
              className={cn(
                "flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-3 text-lg transition-colors hover:border-primary/60 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                option === o.id && "border-primary bg-primary-soft",
              )}
            >
              <input
                type="radio"
                name={`option-${exercise.id}`}
                value={o.id}
                checked={option === o.id}
                onChange={() => setOption(o.id)}
                className="size-5 accent-[var(--primary)]"
              />
              <span lang="en">{o.text}</span>
            </label>
          ))}
        </fieldset>
      )}

      {!exam && exercise.hint_es && onShowHint && (
        <div aria-live="polite">
          {hintShown ? (
            <p id={ids.hint} className="flex gap-2 rounded-2xl bg-accent-soft p-4">
              <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold">Pista: </span>
                {exercise.hint_es}
              </span>
            </p>
          ) : (
            <Button type="button" variant="link" onClick={onShowHint} disabled={disabled}>
              <Lightbulb aria-hidden /> Ver una pista (cuenta como ayuda)
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={!canSubmit || disabled}>
          {disabled ? (exam ? "Guardando…" : "Comprobando…") : exam ? "Siguiente" : "Comprobar"}
        </Button>
        {exam && onUnsure && exercise.type !== "open_response" && (
          <Button type="button" variant="secondary" onClick={onUnsure} disabled={disabled}>
            No lo sé
          </Button>
        )}
      </div>
    </form>
  );
}
