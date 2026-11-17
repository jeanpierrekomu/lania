"""Salidas estructuradas que exigimos a los modelos. Se validan con Pydantic tras cada llamada."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class _Out(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CriterionScore(_Out):
    score: int = Field(ge=0, le=3)
    comment_es: str = Field(max_length=400)


class WritingError(_Out):
    span: str = Field(min_length=1, max_length=200)  # DEBE ser texto literal del alumno
    type: Literal["grammar", "vocabulary", "spelling", "word_order", "punctuation"]
    severity: Literal["primary", "secondary"]
    rule_code: str | None
    explanation_es: str = Field(max_length=400)
    minimal_correction: str = Field(max_length=200)


class WritingEvalOutput(_Out):
    """Rúbrica writing_v1: cuatro criterios 0–3 (spec §2.2 Etapa D)."""

    task_fulfillment: CriterionScore
    accuracy: CriterionScore
    coherence: CriterionScore
    range: CriterionScore
    strengths_es: str = Field(max_length=500)
    errors: list[WritingError] = Field(max_length=8)
    natural_version_en: str | None = Field(max_length=1200)
    uncertain: bool
    uncertainty_reason_es: str | None


class TutorCorrection(_Out):
    original: str = Field(min_length=1, max_length=200)
    corrected: str = Field(min_length=1, max_length=200)
    explanation_es: str = Field(max_length=400)


class TutorReplyOutput(_Out):
    message: str = Field(min_length=1, max_length=1500)
    corrections: list[TutorCorrection] = Field(max_length=2)  # máx. 2 errores prioritarios por turno
    practice_prompt_en: str | None = Field(max_length=300)
    suggested_skill_code: str | None


class SpeakingTurnOutput(_Out):
    """Respuesta de Lania a un turno hablado dentro de un escenario (Speaking Lab)."""

    on_task: bool  # ¿la persona respondió a lo que pedía este paso (aunque sea con errores)?
    corrections: list[TutorCorrection] = Field(max_length=2)  # «original» DEBE ser texto literal transcrito
    natural_version_en: str | None = Field(max_length=400)  # cómo lo diría alguien de forma natural
    feedback_es: str = Field(min_length=1, max_length=500)  # 1–2 frases: qué salió bien y qué mejorar
    reply_en: str = Field(min_length=1, max_length=300)  # reacción breve en el rol, SIN la siguiente pregunta
