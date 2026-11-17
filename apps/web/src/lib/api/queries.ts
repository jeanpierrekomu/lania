"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap, type Schemas } from "./client";

export const keys = {
  me: ["me"] as const,
  progress: ["progress"] as const,
  next: ["learning-next"] as const,
  lesson: (slug: string) => ["lesson", slug] as const,
  reviewSession: ["review-session"] as const,
  health: ["health"] as const,
  clock: ["dev-clock"] as const,
};

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => unwrap(api.GET("/api/v1/me")) });
export const useProgress = () =>
  useQuery({ queryKey: keys.progress, queryFn: () => unwrap(api.GET("/api/v1/progress")) });
export const useNextMission = () =>
  useQuery({ queryKey: keys.next, queryFn: () => unwrap(api.GET("/api/v1/learning/next")) });
export const useHealth = () =>
  useQuery({ queryKey: keys.health, queryFn: () => unwrap(api.GET("/api/v1/health")), staleTime: Infinity });

export const useLesson = (slug: string) =>
  useQuery({
    queryKey: keys.lesson(slug),
    queryFn: () => unwrap(api.GET("/api/v1/lessons/{slug}", { params: { path: { slug } } })),
    staleTime: Infinity,
  });

/** La sesión de repaso se congela al abrirla: no se recalcula mientras respondes. */
export const useReviewSession = () =>
  useQuery({
    queryKey: keys.reviewSession,
    queryFn: () => unwrap(api.GET("/api/v1/reviews/session")),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas["AttemptIn"]) => unwrap(api.POST("/api/v1/attempts", { body })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.progress });
      void qc.invalidateQueries({ queryKey: keys.next });
      // Laboratorios: «x de 3 preguntas» y misiones se recalculan con la nueva evidencia.
      void qc.invalidateQueries({ queryKey: ["reading-texts"] });
      void qc.invalidateQueries({ queryKey: ["listening-episodes"] });
      void qc.invalidateQueries({ queryKey: ["missions"] });
    },
  });
}

export function useDispute() {
  return useMutation({
    mutationFn: ({ evaluationId, reason }: { evaluationId: string; reason: string }) =>
      unwrap(
        api.POST("/api/v1/evaluations/{evaluation_id}/dispute", {
          params: { path: { evaluation_id: evaluationId } },
          body: { reason },
        }),
      ),
  });
}

export function useDevClock(enabled: boolean) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: keys.clock,
    queryFn: () => unwrap(api.GET("/api/v1/dev/clock")),
    enabled,
  });
  const mutation = useMutation({
    mutationFn: (body: Schemas["ClockIn"]) => unwrap(api.POST("/api/v1/dev/clock", { body })),
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
  return { query, mutation };
}

// ── Entrega 2: diagnóstico, tutor, preferencias, revisión docente ──

export const keys2 = {
  diagnosticCurrent: ["diagnostic-current"] as const,
  report: (runId: string) => ["diagnostic-report", runId] as const,
  tutor: (id: string) => ["tutor", id] as const,
  disputes: (status: string) => ["admin-disputes", status] as const,
  aiUsage: ["admin-ai-usage"] as const,
};

export const useDiagnosticCurrent = () =>
  useQuery({
    queryKey: keys2.diagnosticCurrent,
    queryFn: () => unwrap(api.GET("/api/v1/diagnostics/current")),
    refetchOnWindowFocus: false,
  });

export function useStartDiagnostic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/v1/diagnostics")),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.next });
      void qc.invalidateQueries({ queryKey: keys2.diagnosticCurrent });
    },
  });
}

export function useAnswerDiagnostic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, body }: { runId: string; body: Schemas["DiagnosticAnswerIn"] }) =>
      unwrap(api.POST("/api/v1/diagnostics/{run_id}/answers", { params: { path: { run_id: runId } }, body })),
    onSuccess: () => {
      // La misión, el progreso y el estado del diagnóstico cambian con cada respuesta (pausar y volver).
      void qc.invalidateQueries({ queryKey: keys.next });
      void qc.invalidateQueries({ queryKey: keys.progress });
      void qc.invalidateQueries({ queryKey: keys2.diagnosticCurrent });
    },
  });
}

/** Mientras haya escritura evaluándose, consulta cada 4 s (sin bloquear la lectura del informe). */
export const useDiagnosticReport = (runId: string) =>
  useQuery({
    queryKey: keys2.report(runId),
    queryFn: () => unwrap(api.GET("/api/v1/diagnostics/{run_id}/report", { params: { path: { run_id: runId } } })),
    refetchInterval: (q) => ((q.state.data?.pending_evaluations ?? 0) > 0 ? 4000 : false),
  });

export const useLatestTutorConversation = () =>
  useQuery({
    queryKey: ["tutor-latest"],
    queryFn: () => unwrap(api.GET("/api/v1/tutor/conversations/latest")),
    refetchOnWindowFocus: false,
  });

export function useCreateConversation() {
  return useMutation({
    mutationFn: (body: Schemas["TutorConversationIn"]) => unwrap(api.POST("/api/v1/tutor/conversations", { body })),
  });
}

export function useSendTutorMessage(conversationId: string) {
  return useMutation({
    mutationFn: (body: Schemas["TutorMessageIn"]) =>
      unwrap(
        api.POST("/api/v1/tutor/conversations/{conversation_id}/messages", {
          params: { path: { conversation_id: conversationId } },
          body,
        }),
      ),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas["PreferencesIn"]) => unwrap(api.PUT("/api/v1/me/preferences", { body })),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

export const useDisputes = (status: "open" | "accepted" | "rejected") =>
  useQuery({
    queryKey: keys2.disputes(status),
    queryFn: () => unwrap(api.GET("/api/v1/admin/disputes", { params: { query: { status } } })),
  });

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Schemas["DisputeResolveIn"] }) =>
      unwrap(api.POST("/api/v1/admin/disputes/{dispute_id}/resolve", { params: { path: { dispute_id: id } }, body })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-disputes"] }),
  });
}

export const useAiUsage = () =>
  useQuery({ queryKey: keys2.aiUsage, queryFn: () => unwrap(api.GET("/api/v1/admin/ai-usage")) });

// ── Privacidad y consentimiento del piloto ──
export function usePilotConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/v1/me/pilot-consent")),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

export function useExportMyData() {
  return useMutation({ mutationFn: () => unwrap(api.GET("/api/v1/privacy/export")) });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.DELETE("/api/v1/privacy/account");
      if (error || !response.ok) throw new Error("No pudimos borrar tu cuenta. Inténtalo de nuevo.");
    },
  });
}

// ── Bienvenida (onboarding) ──
export function useSaveOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas["OnboardingIn"]) => unwrap(api.PUT("/api/v1/me/onboarding", { body })),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

// ── Writing Lab ──
export const useWritingPrompts = () =>
  useQuery({
    queryKey: ["writing-prompts"],
    queryFn: () => unwrap(api.GET("/api/v1/writing/prompts")),
    staleTime: Infinity,
  });

export const useWritingHistory = () =>
  useQuery({ queryKey: ["writing-history"], queryFn: () => unwrap(api.GET("/api/v1/writing/submissions")) });

export function useSubmitWriting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas["WritingSubmissionIn"]) => unwrap(api.POST("/api/v1/writing/submissions", { body })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["writing-history"] });
      void qc.invalidateQueries({ queryKey: keys.progress });
    },
  });
}

// ── Listening y Speaking Lab ──
export const useEpisodes = () =>
  useQuery({ queryKey: ["listening-episodes"], queryFn: () => unwrap(api.GET("/api/v1/listening/episodes")) });

export const useEpisode = (slug: string | undefined) =>
  useQuery({
    queryKey: ["listening-episode", slug],
    queryFn: () => unwrap(api.GET("/api/v1/listening/episodes/{slug}", { params: { path: { slug: slug! } } })),
    enabled: Boolean(slug),
  });

export const useScenarios = () =>
  useQuery({
    queryKey: ["speaking-scenarios"],
    queryFn: () => unwrap(api.GET("/api/v1/speaking/scenarios")),
    staleTime: Infinity,
  });

export function useStartSpeaking() {
  return useMutation({
    mutationFn: (scenario: string) => unwrap(api.POST("/api/v1/speaking/sessions", { body: { scenario } })),
  });
}

export function useSpeakingTurn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      clientTurnId,
      text,
      audio,
      seconds,
    }: {
      sessionId: string;
      clientTurnId: string;
      text?: string;
      audio?: Blob;
      seconds?: number;
    }) => {
      const form = new FormData();
      form.set("client_turn_id", clientTurnId);
      if (text !== undefined) form.set("text", text);
      if (seconds !== undefined) form.set("seconds", String(Math.round(seconds * 10) / 10));
      if (audio) form.set("audio", audio, `turn.${audio.type.includes("mp4") ? "m4a" : "webm"}`);
      return unwrap(
        api.POST("/api/v1/speaking/sessions/{session_id}/turns", {
          params: { path: { session_id: sessionId } },
          // FormData tal cual: el navegador pone el boundary del multipart.
          body: form as never,
          bodySerializer: (b: unknown) => b as FormData,
        }),
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.progress }),
  });
}

// ── Misiones ──
export const useMissions = () =>
  useQuery({ queryKey: ["missions"], queryFn: () => unwrap(api.GET("/api/v1/missions")) });

// ── Comentarios del piloto ──
export function useSendFeedback() {
  return useMutation({
    mutationFn: async (body: Schemas["FeedbackIn"]) => {
      const { error, response } = await api.POST("/api/v1/feedback", { body });
      if (error || !response.ok) throw new Error("No pudimos enviar tu comentario. Inténtalo de nuevo.");
    },
  });
}

export const useAdminFeedback = () =>
  useQuery({ queryKey: ["admin-feedback"], queryFn: () => unwrap(api.GET("/api/v1/admin/feedback")) });

// ── Reading Lab ──
export const useReadings = () =>
  useQuery({ queryKey: ["reading-texts"], queryFn: () => unwrap(api.GET("/api/v1/reading/texts")) });

export const useReading = (slug: string | undefined) =>
  useQuery({
    queryKey: ["reading-text", slug],
    queryFn: () => unwrap(api.GET("/api/v1/reading/texts/{slug}", { params: { path: { slug: slug! } } })),
    enabled: Boolean(slug),
  });
