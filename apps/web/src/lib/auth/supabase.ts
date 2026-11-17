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
  const meta = s.user.user_metadata as { display_name?: string } | undefined;
  saveSession({
    accessToken: s.access_token,
    expiresAt: (s.expires_at ?? Math.floor(Date.now() / 1000) + s.expires_in) * 1000,
    displayName: meta?.display_name ?? null,
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

/** Envía el enlace mágico. La persona vuelve a /login con la sesión en la URL. */
export async function sendMagicLink(email: string, displayName: string | null) {
  const sb = getSupabase();
  if (!sb) throw new Error("El acceso por correo no está configurado.");
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });
  if (error) throw new Error("No pudimos enviar el enlace. Revisa el correo e inténtalo de nuevo.");
}

export async function signOutEverywhere() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  clearSession();
}
