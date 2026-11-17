import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnswerFeedback } from "@/components/learning/answer-feedback";

import { attemptResult } from "./fixtures";

function wrap(ui: ReactNode) {
  return render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);
}

describe("AnswerFeedback", () => {
  it("anuncia el resultado con texto (no solo color) y ofrece reintento antes de revelar", async () => {
    const onRetry = vi.fn();
    wrap(
      <AnswerFeedback result={attemptResult()} reviewScheduled onRetry={onRetry} onContinue={vi.fn()} continueLabel="Siguiente" />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Todavía no");
    expect(screen.getByRole("heading", { name: /Todavía no/ })).toHaveFocus();
    expect(screen.queryByText("My sister works at a design studio.")).not.toBeInTheDocument();
    expect(screen.getByText(/Volveremos a practicar esta habilidad/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("revela la versión correcta y el porqué cuando se pide", async () => {
    wrap(
      <AnswerFeedback result={attemptResult()} reviewScheduled={false} onRetry={vi.fn()} onContinue={vi.fn()} continueLabel="Siguiente" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ver la respuesta" }));
    expect(screen.getByText("My sister works at a design studio.")).toBeInTheDocument();
    expect(screen.getByText("My sister equivale a she.")).toBeInTheDocument();
  });

  it("una respuesta correcta explica por qué en lugar de repetir «¡Correcto!»", () => {
    wrap(
      <AnswerFeedback
        result={attemptResult({ verdict: "correct", score: 1, errors: [], next_action: "continue", feedback_es: "¡Correcto!" })}
        reviewScheduled={false}
        onContinue={vi.fn()}
        continueLabel="Siguiente"
      />,
    );
    expect(screen.getAllByText("¡Correcto!")).toHaveLength(1);
    expect(screen.getByText("My sister equivale a she.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /revisión/ })).not.toBeInTheDocument();
  });

  it("una alternativa válida se celebra como válida", () => {
    wrap(
      <AnswerFeedback
        result={attemptResult({ verdict: "valid_alternative", score: 1, errors: [], next_action: "continue" })}
        reviewScheduled={false}
        onContinue={vi.fn()}
        continueLabel="Siguiente"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Respuesta válida");
  });

  it("permite pedir revisión de una corrección", async () => {
    wrap(
      <AnswerFeedback result={attemptResult()} reviewScheduled={false} onContinue={vi.fn()} continueLabel="Siguiente" />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Pide una revisión/ }));
    expect(screen.getByLabelText("¿Por qué crees que es correcta?")).toBeInTheDocument();
  });
});
