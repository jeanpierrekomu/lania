import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionRenderer } from "@/components/learning/question-renderer";

import { choice, fillBlank } from "./fixtures";

describe("QuestionRenderer", () => {
  it("envía la respuesta escrita con Enter y la etiqueta es accesible", async () => {
    const onSubmit = vi.fn();
    render(<QuestionRenderer exercise={fillBlank} hintShown={false} onShowHint={vi.fn()} onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Tu respuesta");
    expect(input).toHaveFocus();
    await userEvent.type(input, "  works {Enter}");
    expect(onSubmit).toHaveBeenCalledWith({ answer_text: "works" });
  });

  it("no permite enviar vacío", async () => {
    const onSubmit = vi.fn();
    render(<QuestionRenderer exercise={fillBlank} hintShown={false} onShowHint={vi.fn()} onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: "Comprobar" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Tu respuesta"), "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("opción múltiple funciona solo con teclado", async () => {
    const onSubmit = vi.fn();
    render(<QuestionRenderer exercise={choice} hintShown={false} onShowHint={vi.fn()} onSubmit={onSubmit} />);
    expect(screen.getByRole("group", { name: "Which sentence is correct?" })).toBeInTheDocument();
    await userEvent.tab();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "She works in marketing." })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onSubmit).toHaveBeenCalledWith({ option_id: "b" });
  });

  it("la pista se pide explícitamente y avisa que cuenta como ayuda", async () => {
    const onShowHint = vi.fn();
    const { rerender } = render(
      <QuestionRenderer exercise={fillBlank} hintShown={false} onShowHint={onShowHint} onSubmit={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /pista \(cuenta como ayuda\)/ }));
    expect(onShowHint).toHaveBeenCalled();
    rerender(<QuestionRenderer exercise={fillBlank} hintShown onShowHint={onShowHint} onSubmit={vi.fn()} />);
    expect(screen.getByText("My sister = she.")).toBeInTheDocument();
  });

  it("conserva el borrador si se recarga la página", async () => {
    const props = { exercise: fillBlank, hintShown: false, onShowHint: vi.fn(), onSubmit: vi.fn(), draftKey: "draft:x" };
    const { unmount } = render(<QuestionRenderer {...props} />);
    await userEvent.type(screen.getByLabelText("Tu respuesta"), "wor");
    unmount();
    render(<QuestionRenderer {...props} />);
    expect(screen.getByLabelText("Tu respuesta")).toHaveValue("wor");
  });
});
