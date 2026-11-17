import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionRenderer } from "@/components/learning/question-renderer";
import type { Schemas } from "@/lib/api/client";

const writing: Schemas["ExerciseOut"] = {
  id: "00000000-0000-0000-0000-0000000000aa",
  external_id: "diag_v1.writing.task_fulfillment.01",
  version: 1,
  type: "open_response",
  skill_code: "writing.task_fulfillment",
  difficulty: 2,
  role: "diagnostic",
  instruction_es: "Escritura libre.",
  task_en: "Describe a typical weekday.",
  min_words: 30,
  max_words: 90,
};

describe("QuestionRenderer · escritura libre (modo examen)", () => {
  it("envía exactamente lo escrito, una sola vez, y cuenta palabras", async () => {
    const onSubmit = vi.fn();
    render(<QuestionRenderer exercise={writing} mode="diagnostic" onSubmit={onSubmit} draftKey="draft:diag:w" />);
    const box = screen.getByLabelText("Tu texto");
    expect(box).toHaveFocus();
    await userEvent.type(box, "I study design every day");
    expect(screen.getByText(/5 palabra\(s\) · sugerido: 30–90/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith({ answer_text: "I study design every day" });
    expect(screen.queryByRole("button", { name: "No lo sé" })).not.toBeInTheDocument();
  });

  it("al volver, recupera el borrador sin duplicarlo", async () => {
    const props = { exercise: writing, mode: "diagnostic" as const, onSubmit: vi.fn(), draftKey: "draft:diag:w2" };
    const first = render(<QuestionRenderer {...props} />);
    await userEvent.type(screen.getByLabelText("Tu texto"), "My boss is nice");
    first.unmount();
    render(<QuestionRenderer {...props} />);
    expect(screen.getByLabelText("Tu texto")).toHaveValue("My boss is nice");
  });

  it("modo examen: sin pistas aunque el ítem las tenga", () => {
    render(
      <QuestionRenderer
        exercise={{ ...writing, type: "fill_blank", sentence_en: "I ___ here.", hint_es: "pista" }}
        mode="diagnostic"
        onSubmit={vi.fn()}
        onShowHint={vi.fn()}
        onUnsure={vi.fn()}
      />,
    );
    expect(screen.queryByText(/pista/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No lo sé" })).toBeInTheDocument();
  });
});
