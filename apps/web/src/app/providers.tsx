"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { ApiError } from "@/lib/api/client";
import { getSupabase } from "@/lib/auth/supabase";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, error) => error instanceof ApiError && error.retryable && error.status !== 401 && count < 2,
          },
          mutations: { retry: false },
        },
      }),
  );
  // Con Supabase activo, inicia el cliente para renovar el token y reflejar la sesión en toda la app.
  useEffect(() => {
    getSupabase();
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
