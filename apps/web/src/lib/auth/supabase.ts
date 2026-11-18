"use client";

/**
 * Adaptador de Supabase Auth (ADR-002). Activo solo si NEXT_PUBLIC_SUPABASE_URL y la clave publicable
 * están definidas; si no, la app sigue con el acceso local de desarrollo (/api/v1/dev/session).
 * Supabase guarda y renueva su propia sesión; aquí solo la reflejamos en el almacén de `session.ts`
 * para que los consumidores (cliente de API, guardas de rutas) no cambien.
 */
import { createClient, type Session as SupabaseSession, type SupabaseClient } from "@supabase/supabase-js";

import { clearSession, saveSession } from "./session";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseEnabled = Boolean(URL && KEY);

let client: SupabaseClient | null = null;

function mirror(s: SupabaseSession | null) {
  if (!s) {
    clearSession();
    return;
  }
  const meta = s.user.user_metadata as { display_name?: string; given_name?: string; full_name?: string; name?: string } | undefined;
  saveSession({
    accessToken: s.access_token,
    expiresAt: (s.expires_at ?? Math.floor(Date.now() / 1000) + s.expires_in) * 1000,
    displayName: meta?.display_name ?? meta?.given_name ?? meta?.full_name ?? meta?.name ?? null,
    guest: s.user.is_anonymous ?? false,
  });
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(URL!, KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    });
    client.auth.onAuthStateChange((_event, s) => mirror(s));
    void client.auth.getSession().then(({ data }) => mirror(data.session));
  }
  return client;
}

export type MagicLinkMode = "login" | "signup";

/** Supabase responde así cuando se pide entrar con un correo que todavía no tiene cuenta. */
export class NoAccountError extends Error {}

/**
 * Envía el enlace mágico. La persona vuelve a /login con la sesión en la URL.
 * «login» no crea cuentas (si el correo no existe, avisa); «signup» la crea al abrir el enlace.
 */
export async function sendMagicLink(email: string, displayName: string | null, mode: MagicLinkMode = "signup") {
  const sb = getSupabase();
  if (!sb) throw new Error("El acceso por correo no está configurado.");
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      shouldCreateUser: mode === "signup",
      data: displayName ? { display_name: displayName } : undefined,
    },
  });
  if (!error) return;
  if (mode === "login" && /signup|not allowed|not found/i.test(error.message)) throw new NoAccountError();
  if (error.status === 429) throw new Error("Pediste varios enlaces seguidos. Espera un minuto e inténtalo de nuevo.");
  throw new Error("No pudimos enviar el enlace. Revisa el correo e inténtalo de nuevo.");
}

/** «Continuar con Google»: se activa poniendo NEXT_PUBLIC_AUTH_GOOGLE=true cuando el proveedor esté listo en Supabase. */
export const googleEnabled = supabaseEnabled && process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";

/** Va a Google y vuelve a /login con la sesión (la lee `detectSessionInUrl`). Crea la cuenta si no existe. */
export async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) throw new Error("El acceso con Google no está configurado.");
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/login` },
  });
  if (error) throw new Error("No pudimos abrir Google. Inténtalo de nuevo.");
}

export async function signOutEverywhere() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  clearSession();
}
