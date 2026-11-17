"""Reglas del diagnóstico diag_v1 — puras, versionadas y explicables (spec §2.1–2.2).

- Adaptación mínima: si una persona falla los dos primeros ítems A1 de una habilidad, no se le
  presentan los A2 de esa habilidad (evita frustración y no aporta evidencia útil).
- Banda por habilidad con «baja falsa precisión»: below_a1 / a1 / a2, nunca por encima de A2,
  y confianza como máximo «media» (un diagnóstico corto solo orienta).
- «No lo sé» cuenta como no logrado: preferimos eso a premiar adivinanzas.
"""

from dataclasses import dataclass
from typing import Literal

ALGORITHM_VERSION = "diag_v1_bands"

Band = Literal["not_assessed", "below_a1", "a1", "a2", "pending_review"]
Confidence = Literal["low", "medium", "high"]
Outcome = Literal["correct", "partial", "incorrect", "unsure", "needs_review", "adaptive_skip", "pending"]

VALUE = {"correct": 1.0, "partial": 0.5, "incorrect": 0.0, "unsure": 0.0}


@dataclass(frozen=True)
class ItemResult:
    skill_code: str
    cefr: str  # "A1" | "A2"
    outcome: Outcome


@dataclass(frozen=True)
class SkillBand:
    skill_code: str
    band: Band
    confidence: Confidence
    evidence_count: int
    correct_count: float
    notes_es: str
    borderline: bool = False


def should_skip_adaptively(cefr: str, earlier_same_skill: list[ItemResult]) -> bool:
    if cefr != "A2":
        return False
    a1 = [r for r in earlier_same_skill if r.cefr == "A1" and r.outcome in VALUE]
    return len(a1) >= 2 and all(VALUE[r.outcome] == 0 for r in a1[:2])


def _mean(results: list[ItemResult]) -> float | None:
    scored = [VALUE[r.outcome] for r in results if r.outcome in VALUE]
    return sum(scored) / len(scored) if scored else None


def band_for_closed(skill_code: str, results: list[ItemResult]) -> SkillBand:
    scored = [r for r in results if r.outcome in VALUE]
    if any(r.outcome == "needs_review" for r in results) and not scored:
        return SkillBand(skill_code, "pending_review", "low", 0, 0, "Tus respuestas quedaron para revisión.")
    if not scored:
        return SkillBand(skill_code, "not_assessed", "low", 0, 0, "Sin respuestas en esta habilidad.")
    correct = sum(VALUE[r.outcome] for r in scored)
    a1 = _mean([r for r in scored if r.cefr == "A1"])
    a2 = _mean([r for r in scored if r.cefr == "A2"])
    confidence: Confidence = "medium" if len(scored) >= 3 else "low"
    skipped = any(r.outcome == "adaptive_skip" for r in results)
    detail = f"{correct:g} de {len(scored)} logradas"

    if a1 is not None and a1 < 0.5:
        note = f"{detail}. Las preguntas básicas (A1) todavía cuestan."
        if skipped:
            note += " Por eso no te mostramos las de nivel A2."
        return SkillBand(skill_code, "below_a1", confidence, len(scored), correct, note)
    if a2 is not None and a2 >= 0.67:
        return SkillBand(
            skill_code,
            "a2",
            confidence,
            len(scored),
            correct,
            f"{detail}, incluidas las de nivel A2. Este diagnóstico no mide por encima de A2.",
        )
    borderline = a2 is not None and 0.34 <= a2 < 0.67
    note = f"{detail}. Dominas lo básico (A1); lo de nivel A2 todavía no es estable."
    if a1 is None:  # solo hubo ítems A2 y no salieron bien: evidencia insuficiente para afirmar A1
        return SkillBand(
            skill_code,
            "a1",
            "low",
            len(scored),
            correct,
            f"{detail}. Evidencia insuficiente: tómalo como una estimación muy gruesa.",
            True,
        )
    return SkillBand(skill_code, "a1", confidence, len(scored), correct, note, borderline)


def band_for_writing(skill_code: str, criterion: str, evaluations: list[dict[str, object] | None]) -> SkillBand:
    """Banda de escritura a partir de los puntajes 0–3 de la rúbrica para un criterio."""
    if not evaluations:
        return SkillBand(skill_code, "not_assessed", "low", 0, 0, "Sin textos escritos.")
    if any(e is None for e in evaluations):
        return SkillBand(
            skill_code,
            "pending_review",
            "low",
            len(evaluations),
            0,
            "Tu escritura está guardada y pendiente de evaluación.",
        )
    scores = [float(e[criterion]["score"]) for e in evaluations if e]  # type: ignore[index]
    avg = sum(scores) / len(scores)
    band: Band = "a2" if avg >= 2.25 else "a1" if avg >= 1.25 else "below_a1"
    return SkillBand(
        skill_code,
        band,
        "low",
        len(scores),
        avg,
        f"Promedio {avg:.1f}/3 en {len(scores)} texto(s), evaluado por IA con rúbrica; "
        "pendiente de validación docente.",
    )


BAND_LABEL_ES: dict[Band, str] = {
    "not_assessed": "No evaluado",
    "below_a1": "Aún por debajo de A1",
    "a1": "A1 (orientativo)",
    "a2": "A2 o más (orientativo)",
    "pending_review": "Pendiente de evaluación",
}

BAND_ORDER: dict[Band, int] = {"below_a1": 0, "a1": 1, "pending_review": 2, "a2": 3, "not_assessed": 4}
