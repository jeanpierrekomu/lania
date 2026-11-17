"use client";

/**
 * Sesión del alumno. Adaptador LOCAL (ADR-002): token emitido por /api/v1/dev/session, solo en desarrollo.
 * El adaptador de Supabase Auth reemplazará `signIn`/`signOut` sin cambiar a los consumidores.
 */
import { useSyncExternalStore } from "react";

/** `guest`: cuenta anónima (sin correo). Su progreso vive en este navegador: cerrar sesión lo perdería. */
export type Session = { accessToken: string; expiresAt: number; displayName: string | null; guest?: boolean };

const KEY = "modo.session.v1";
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: Session | null } = { raw: null, value: null };

function read(): Session | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw === cached.raw) return cached.value;
  let value: Session | null = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as Session) : null;
    value = parsed && parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    value = null;
  }
  cached = { raw, value };
  return value;
}

function emit() {
  listeners.forEach((l) => l());
}

export function getSession(): Session | null {
  return typeof window === "undefined" ? null : read();
}

export function saveSession(session: Session) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } finally {
    emit();
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY);
  } finally {
    emit();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** `undefined` mientras hidrata (servidor), `null` sin sesión. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, getSession, () => undefined);
}
