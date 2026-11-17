"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/states";
import type { Schemas } from "@/lib/api/client";
import { useMe, useUpdatePreferences } from "@/lib/api/queries";
import { TUTOR_NAME } from "@/lib/brand";

type Prefs = Schemas["PreferencesIn"];

const GROUPS: {
  key: keyof Prefs;
  legend: string;
  help: string;
  options: { value: Prefs[keyof Prefs]; label: string; detail: string }[];
}[] = [
  {
    key: "tutor_persona",
    legend: `Estilo de ${TUTOR_NAME}`,
    help: "Cambia el tono, nunca las correcciones ni las notas.",
    options: [
      { value: "fun", label: "Divertida", detail: "Cálida y despierta, con humor cuando viene al caso." },
      { value: "calm", label: "Tranquila", detail: "Paciente, frases cortas y sin prisa." },
      { value: "coach", label: "Directa", detail: "Va al punto, con retos concretos." },
    ],
  },
  {
    key: "feedback_intensity",
    legend: "Cantidad de correcciones",
    help: `Cuántos errores te señala ${TUTOR_NAME} por mensaje.`,
    options: [
      { value: "gentle", label: "Suave", detail: "Solo lo que impide entenderte." },
      { value: "balanced", label: "Equilibrada", detail: "Hasta 2 errores prioritarios." },
      { value: "intense", label: "Intensa", detail: "También naturalidad, máximo 2 por mensaje." },
    ],
  },
  {
    key: "translation_support",
    legend: "Español de apoyo",
    help: "Se puede ir retirando a medida que avanzas.",
    options: [
      { value: "always", label: "Siempre", detail: "Explicaciones y traducciones en español." },
      { value: "when_stuck", label: "Cuando me trabo", detail: "Inglés sencillo; español si lo necesito." },
      { value: "off", label: "Solo inglés", detail: "Español únicamente si lo pido." },
    ],
  },
  {
    key: "lesson_duration_min",
    legend: "Duración preferida de sesión",
    help: "Una guía, no un límite: puedes seguir o pausar cuando quieras.",
    options: [
      { value: 5, label: "5 min", detail: "Microsesión." },
      { value: 10, label: "10 min", detail: "Una clase corta." },
      { value: 20, label: "20 min", detail: "Clase + repaso." },
      { value: 0, label: "Libre", detail: "Sin referencia de tiempo." },
    ],
  },
  {
    key: "humor_level",
    legend: `Humor de ${TUTOR_NAME}`,
    help: "Nunca a costa tuya. Puedes bajarlo cuando quieras concentrarte.",
    options: [
      { value: 0, label: "Sin humor", detail: "Tono amable y neutro." },
      { value: 1, label: "Muy poco", detail: "Algún comentario ligero ocasional." },
      { value: 3, label: "Equilibrado", detail: "Una broma breve cuando encaja." },
      { value: 5, label: "Mucho", detail: "Más juguetona, sin perder precisión." },
    ],
  },
  {
    key: "show_avatar",
    legend: `Avatar de ${TUTOR_NAME}`,
    help: "La imagen es opcional; todo funciona igual sin ella.",
    options: [
      { value: true, label: "Mostrar", detail: "Ver a la tutora en el chat y el inicio." },
      { value: false, label: "Ocultar", detail: "Solo texto, menos estímulos." },
    ],
  },
  {
    key: "reduce_motion",
    legend: "Animaciones",
    help: "También respetamos la preferencia de movimiento reducido de tu sistema.",
    options: [
      { value: false, label: "Normales", detail: "Transiciones suaves y breves." },
      { value: true, label: "Reducir", detail: "Sin movimiento en la interfaz." },
    ],
  },
  {
    key: "low_stim_mode",
    legend: "Modo baja estimulación",
    help: "Menos color y sin animaciones, para concentrarte.",
    options: [
      { value: false, label: "Desactivado", detail: "Interfaz normal." },
      { value: true, label: "Activado", detail: "Colores neutros y sin movimiento." },
    ],
  },
];

export function PreferencesForm() {
  const me = useMe();
  const update = useUpdatePreferences();
  const [draft, setDraft] = useState<Prefs | null>(null);

  if (me.isPending) return <LoadingState />;
  if (me.isError) return <ErrorState message={me.error.message} onRetry={() => void me.refetch()} />;
  const prefs = draft ?? (me.data.preferences as Prefs);

  function submit(e: FormEvent) {
    e.preventDefault();
    update.mutate(prefs, { onSuccess: () => setDraft(null) });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Preferencias</h1>
      <p className="text-ink-muted">
        Ajusta cómo aprendes. No pedimos ni guardamos diagnósticos médicos: solo lo que te ayuda a estudiar.
      </p>
      {GROUPS.map((g) => (
        <fieldset key={g.key} className="flex flex-col gap-2">
          <legend className="font-display text-lg font-bold">{g.legend}</legend>
          <p className="text-sm text-ink-muted">{g.help}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.options.map((o) => (
              <label
                key={String(o.value)}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary"
              >
                <input
                  type="radio"
                  name={g.key}
                  className="mt-1 size-5 accent-[var(--primary)]"
                  checked={prefs[g.key] === o.value}
                  onChange={() => setDraft({ ...prefs, [g.key]: o.value })}
                />
                <span>
                  <span className="font-semibold">{o.label}</span>
                  <span className="block text-sm text-ink-muted">{o.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {update.isError && <ErrorState message={update.error.message} />}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={!draft || update.isPending}>
          Guardar cambios
        </Button>
        {update.isSuccess && !draft && (
          <p role="status" className="flex items-center gap-1 text-success">
            <Check className="size-5" aria-hidden /> Guardado
          </p>
        )}
      </div>
    </form>
  );
}
