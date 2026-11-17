"use client";

import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "@modo/contracts";

import { clearSession, getSession } from "@/lib/auth/session";

export type Schemas = components["schemas"];
export type ErrorBody = Schemas["ErrorBody"];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** Error tipado de la API (spec §7.3): mensaje apto para el alumno y si conviene reintentar. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ErrorBody | null,
  ) {
    super(body?.message_es ?? "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
  }
  get retryable() {
    return this.body?.retryable ?? true;
  }
}

const auth: Middleware = {
  onRequest({ request }) {
    const session = getSession();
    if (session) request.headers.set("Authorization", `Bearer ${session.accessToken}`);
    return request;
  },
  onResponse({ response }) {
    if (response.status === 401) clearSession();
    return response;
  },
};

export const api = createClient<paths>({ baseUrl: API_BASE_URL });
api.use(auth);

/** Convierte la respuesta de openapi-fetch en datos o ApiError (para TanStack Query). */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result: { data?: T; error?: unknown; response: Response };
  try {
    result = await promise;
  } catch {
    throw new ApiError(0, null);
  }
  if (result.data !== undefined) return result.data;
  const body = (result.error ?? null) as ErrorBody | null;
  throw new ApiError(result.response.status, body && "error_code" in body ? body : null);
}
