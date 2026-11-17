"""Arnés de evaluación de IA (spec §8.4): mide un proveedor/modelo con casos fijos, sin tocar la base.

Uso (desde apps/api):
  uv run python -m scripts.eval_ai                                   # modelos configurados en .env
  uv run python -m scripts.eval_ai --base-url https://api.openai.com/v1 \\
      --fast gpt-6-luna --fast-effort low --deep gpt-6-luna --deep-effort medium \\
      --price-in 0.10 --price-out 0.50                               # precio oficial USD/1M tokens
  uv run python -m scripts.eval_ai t09-correct-continuous w03-spanish-text   # solo algunos casos

La clave se lee de LLM_API_KEY (.env). Escribe docs/operations/ai-eval-<modelos>-<fecha-hora>.md.
Aplica EXACTAMENTE los mismos filtros que producción (validador del tutor, citas literales, idioma).
Antes de cambiar de modelo o de prompt: correr y comparar. No elegir solo por precio.
"""

import argparse
import json
import re
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel

from app.ai.gateway import get_provider
from app.ai.outputs import TutorReplyOutput, WritingEvalOutput
from app.ai.prompts.academic import wrap_learner_text
from app.ai.providers.base import ChatMessage, LLMRequest, ProviderError
from app.ai.schema_tools import strict_schema
from app.content.loader import load_content
from app.content.models import OpenResponseAnswer, OpenResponsePrompt
from app.core.config import REPO_ROOT, get_settings
from app.domain.tutor.service import _validator, build_system_prompt
from app.domain.writing.evaluator import anchor_errors, build_messages, looks_not_english

CASES = Path(__file__).resolve().parents[1] / "tests" / "ai_eval" / "cases_v1.yaml"


@dataclass
class Result:
    case: str
    passed: bool
    latency_s: float
    problems: list[str] = field(default_factory=list)
    tokens_in: int = 0
    tokens_out: int = 0


@dataclass
class Run:
    fast: str
    deep: str
    fast_effort: str | None
    deep_effort: str | None


def _call[T: BaseModel](
    model: str, effort: str | None, messages: list[ChatMessage], out: type[T], name: str
) -> tuple[T | None, float, str, int, int]:
    provider = get_provider(get_settings())
    assert provider is not None, "Configura LLM_PROVIDER/LLM_* para evaluar"
    t0 = time.monotonic()
    try:
        res = provider.complete(
            LLMRequest(
                model=model,
                messages=messages,
                schema_name=name,
                json_schema=strict_schema(out),
                temperature=0.2,
                max_output_tokens=4000 if effort else 1400,
                reasoning_effort=effort,
            )
        )
    except ProviderError as exc:
        return None, time.monotonic() - t0, f"error del proveedor: {exc.code}", 0, 0
    secs = time.monotonic() - t0
    try:
        parsed = out.model_validate(json.loads(res.text))
    except Exception as exc:
        return None, secs, f"salida inválida: {type(exc).__name__}", res.input_tokens or 0, res.output_tokens or 0
    return parsed, secs, "", res.input_tokens or 0, res.output_tokens or 0


def eval_tutor(case: dict[str, Any], run: Run) -> Result:
    system = build_system_prompt("fun", "balanced", "when_stuck", "Sin historial pedagógico todavía.")
    messages = [ChatMessage("system", system), ChatMessage("user", wrap_learner_text(case["text"]))]
    out, secs, err, t_in, t_out = _call(run.fast, run.fast_effort, messages, TutorReplyOutput, "tutor_reply")
    r = Result(case["id"], True, secs, tokens_in=t_in, tokens_out=t_out)
    if out is None:
        r.passed, r.problems = False, [err]
        return r
    out = _validator(case["text"], set())(out)  # exactamente el mismo filtro que producción
    corrections = out.corrections
    fixed = [c.corrected.lower() for c in corrections]
    if "corrected_any" in case and not any(any(f in c for f in case["corrected_any"]) for c in fixed):
        r.problems.append(f"no corrigió como se esperaba ({case['corrected_any']}); propuso {fixed}")
    for bad in case.get("forbid_corrected", []):
        if any(bad in c + " " for c in fixed):
            r.problems.append(f"corrección errónea: «{bad.strip()}»")
    for frag in case.get("no_corrections_on", []):
        if any(frag in c.original.lower() for c in corrections):
            r.problems.append(f"marcó como error algo válido: «{frag}»")
    if "max_corrections" in case and len(corrections) > case["max_corrections"]:
        r.problems.append(f"corrigió inglés válido: {[f'{c.original} → {c.corrected}' for c in corrections]}")
    refused = "unless_message_regex" in case and re.search(case["unless_message_regex"], out.message)
    if "forbid_message_regex" in case and re.search(case["forbid_message_regex"], out.message) and not refused:
        r.problems.append("el mensaje viola una regla de seguridad (certificación/identidad)")
    if "require_message_regex" in case and not re.search(case["require_message_regex"], out.message):
        r.problems.append("el mensaje no cumple un requisito (p. ej., declarar que es una IA)")
    r.passed = not r.problems
    return r


def eval_writing(case: dict[str, Any], run: Run, items: dict[str, Any]) -> Result:
    if looks_not_english(case["text"]):  # mismo filtro determinista que producción, antes de la IA
        ok = bool(case.get("expect_uncertain"))
        return Result(case["id"], ok, 0.0, [] if ok else ["el filtro de idioma rechazó un texto en inglés"])
    item = items[case["item"]]
    prompt = OpenResponsePrompt.model_validate(item.prompt.model_dump())
    spec = OpenResponseAnswer.model_validate(item.answer.model_dump())
    out, secs, err, t_in, t_out = _call(
        run.deep, run.deep_effort, build_messages(prompt, spec, case["text"]), WritingEvalOutput, "writing_eval"
    )
    r = Result(case["id"], True, secs, tokens_in=t_in, tokens_out=t_out)
    if out is None:
        r.passed, r.problems = False, [err]
        return r
    kept, dropped = anchor_errors(case["text"], out.errors)
    if dropped:
        r.problems.append(f"{dropped} error(es) con cita inventada")
    spans = " | ".join(e["span"].lower() for e in kept)
    for group in case.get("expect_spans_any", []):
        if not any(g in spans for g in group):
            r.problems.append(f"no detectó {group}")
    for frag in case.get("forbid_spans", []):
        if frag in spans:
            r.problems.append(f"marcó como error una variante válida: «{frag}»")
    if "max_errors" in case and len(kept) > case["max_errors"]:
        r.problems.append(f"marcó {len(kept)} errores en un texto correcto: {spans}")
    if "min_accuracy" in case and out.accuracy.score < case["min_accuracy"]:
        r.problems.append(f"precisión {out.accuracy.score}/3 en un texto correcto")
    if case.get("expect_uncertain") and not out.uncertain:
        r.problems.append("evaluó como inglés un texto que no lo es (debió marcar uncertain)")
    r.passed = not r.problems
    return r


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("cases", nargs="*", help="ids de casos (vacío = todos)")
    parser.add_argument("--base-url")
    parser.add_argument("--fast")
    parser.add_argument("--deep")
    parser.add_argument("--fast-effort", choices=["none", "low", "medium", "high"])
    parser.add_argument("--deep-effort", choices=["none", "low", "medium", "high"])
    parser.add_argument("--price-in", type=float, help="USD por 1M tokens de entrada (página oficial)")
    parser.add_argument("--price-out", type=float, help="USD por 1M tokens de salida (página oficial)")
    args = parser.parse_args()

    settings = get_settings()
    settings.llm_provider = "openai_compatible"
    if args.base_url:
        settings.llm_base_url = args.base_url
    run = Run(
        fast=args.fast or settings.llm_fast_model or "?",
        deep=args.deep or settings.llm_deep_model or "?",
        fast_effort=args.fast_effort or settings.llm_fast_reasoning_effort,
        deep_effort=args.deep_effort or settings.llm_deep_reasoning_effort,
    )
    cases = yaml.safe_load(CASES.read_text(encoding="utf-8"))
    items = {i.id: i for i in load_content().items}
    only = set(args.cases)
    results = [("tutor", eval_tutor(c, run)) for c in cases["tutor"] if not only or c["id"] in only]
    results += [("writing", eval_writing(c, run, items)) for c in cases["writing"] if not only or c["id"] in only]

    tok_in = sum(r.tokens_in for _, r in results)
    tok_out = sum(r.tokens_out for _, r in results)
    cost = (
        f"US$ {(tok_in * args.price_in + tok_out * args.price_out) / 1e6:.4f}"
        if args.price_in is not None and args.price_out is not None
        else "sin precio indicado"
    )
    lines = [
        f"# Evaluación de IA — {datetime.now(UTC):%Y-%m-%d %H:%M} UTC",
        "",
        f"Base: `{settings.llm_base_url}` · tutor: `{run.fast}` (razonamiento: {run.fast_effort or '—'}) · "
        f"escritura: `{run.deep}` (razonamiento: {run.deep_effort or '—'}) · casos: `{CASES.name}`",
        "",
        f"Tokens: {tok_in} entrada · {tok_out} salida · costo de esta corrida: {cost}",
        "",
    ]
    for task in ("tutor", "writing"):
        rs = [r for t, r in results if t == task]
        if not rs:
            continue
        lat = sorted(r.latency_s for r in rs)
        lines.append(
            f"**{task}: {sum(r.passed for r in rs)}/{len(rs)} casos aprobados** · latencia mediana "
            f"{lat[len(lat) // 2]:.1f} s · máx {lat[-1]:.1f} s"
        )
    valid = [r for t, r in results if t == "tutor" and int(r.case[1:3]) in (8, 9, 10, *range(13, 21))]
    if valid:
        lines.append(f"**Inglés válido sin tocar (crítico): {sum(r.passed for r in valid)}/{len(valid)}**")
    lines += ["", "| Tarea | Caso | Resultado | Latencia | Problemas |", "|---|---|---|---|---|"]
    for task, r in results:
        lines.append(
            f"| {task} | {r.case} | {'✅' if r.passed else '❌'} | {r.latency_s:.1f} s | "
            f"{'; '.join(r.problems) or '—'} |"
        )
    name = re.sub(r"[^a-z0-9]+", "-", f"{run.fast}-{run.deep}".lower()).strip("-")
    target = REPO_ROOT / "docs" / "operations" / f"ai-eval-{name}-{datetime.now(UTC):%Y-%m-%d-%H%M}.md"
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:9]))
    print(f"\nInforme → {target.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
