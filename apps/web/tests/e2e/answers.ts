import fs from "node:fs";
import path from "node:path";

import { parse } from "yaml";

type Item = {
  type: "fill_blank" | "choice" | "open_response";
  prompt: { sentence_en?: string; question_en?: string; options?: { id: string; text: string }[] };
  answer: { accepted?: string[]; correct_option?: string };
};

/** Pares «pregunta||opción correcta»: varias preguntas comparten enunciado (p. ej. «Which sentence is correct?»). */
export const CORRECT_OPTIONS = new Set<string>();

/** Claves leídas del mismo YAML que siembra la base: el test no duplica respuestas a mano. */
export function answerKey(): Map<string, { text?: string; option?: string }> {
  const dir = path.resolve(__dirname, "../../../../packages/content-seeds/items");
  const items = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .flatMap((f) => (parse(fs.readFileSync(path.join(dir, f), "utf8"), { merge: true }) as { items: Item[] }).items);
  const key = new Map<string, { text?: string; option?: string }>();
  for (const item of items) {
    if (item.type !== "fill_blank" && item.type !== "choice") continue;
    if (item.type === "fill_blank") key.set(item.prompt.sentence_en!.split("___")[1].trim(), { text: item.answer.accepted![0] });
    else {
      const option = item.prompt.options!.find((o) => o.id === item.answer.correct_option)!;
      key.set(item.prompt.question_en!, { option: option.text });
      CORRECT_OPTIONS.add(`${item.prompt.question_en}||${option.text}`);
    }
  }
  return key;
}
