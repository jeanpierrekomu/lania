"""Contratos públicos de la API v1. Fuente del OpenAPI → tipos TS (`packages/contracts`)."""

import uuid
from datetime import date, datetime
from typing import Any, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

Verdict = Literal["correct", "valid_alternative", "less_natural", "spelling_error", "partial", "incorrect"]
MasteryState = Literal["not_assessed", "emerging", "developing", "proficient", "review_due"]
Confidence = Literal["low", "medium", "high"]


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── auth / perfil ──
class DevSessionIn(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    display_name: str | None = Field(default=None, min_length=1, max_length=60)


class PreferencesOut(Out):
    tutor_persona: Literal["fun", "calm", "coach"]
    feedback_intensity: Literal["gentle", "balanced", "intense"]
    lesson_duration_min: Literal[0, 5, 10, 20]
    translation_support: Literal["always", "when_stuck", "off"]
    low_stim_mode: bool
    humor_level: int = Field(default=3, ge=0, le=5)
    show_avatar: bool = True
    reduce_motion: bool = False


class PreferencesIn(BaseModel):
    tutor_persona: Literal["fun", "calm", "coach"]
    feedback_intensity: Literal["gentle", "balanced", "intense"]
    lesson_duration_min: Literal[0, 5, 10, 20]
    translation_support: Literal["always", "when_stuck", "off"]
    low_stim_mode: bool
    humor_level: int = Field(default=3, ge=0, le=5)
    show_avatar: bool = True
    reduce_motion: bool = False


TeacherStyle = Literal["divertida", "tranquila", "exigente"]


class OnboardingOut(Out):
    goal: str
    self_level: str
    interests: list[str]
    session_minutes: Literal[5, 15, 30]
    onboarded_at: datetime


class OnboardingIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=60)
    goal: str = Field(pattern=r"^[a-z_]{2,30}$")
    self_level: str = Field(pattern=r"^[a-z0-9_]{1,10}$")
    interests: list[str] = Field(min_length=1, max_length=5)
    session_minutes: Literal[5, 15, 30]
    teacher_style: TeacherStyle
    pilot_consent: bool = Field(description="Acepta participar en el piloto (obligatorio para continuar).")

    @model_validator(mode="after")
    def check(self) -> Self:
        if not self.pilot_consent:
            raise ValueError("Necesitamos tu consentimiento para participar en el piloto")
        if any(not i.replace("_", "").isalpha() or len(i) > 30 for i in self.interests):
            raise ValueError("Intereses no válidos")
        self.display_name = self.display_name.strip()
        if not self.display_name:
            raise ValueError("Escribe cómo quieres que te llamemos")
        return self


class MeOut(Out):
    id: uuid.UUID
    display_name: str | None
    locale: str
    timezone: str
    role: Literal["student", "content_editor", "teacher_reviewer", "moderator", "admin"]
    pilot_consent_at: datetime | None = None
    onboarding: OnboardingOut | None = None
    preferences: PreferencesOut


class SessionOut(Out):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: MeOut


class PrivacyExportOut(Out):
    exported_at: str
    email: str | None
    tables: dict[str, list[dict[str, Any]]]


class HealthOut(Out):
    status: Literal["ok"]
    app_env: str
    auth_mode: str
    ai_available: bool


class ClockIn(BaseModel):
    advance_days: int = Field(default=0, ge=0, le=60)
    reset: bool = False


class ClockOut(Out):
    now: datetime
    offset_days: float


# ── contenido ──
class ChoiceOptionOut(Out):
    id: str
    text: str


class ExerciseOut(Out):
    """Solo la parte pública del ítem: nunca claves ni distractores."""

    id: uuid.UUID
    external_id: str
    version: int
    type: Literal["choice", "fill_blank", "open_response"]
    skill_code: str
    difficulty: int
    role: Literal["warmup", "practice", "review", "diagnostic"]
    instruction_es: str
    sentence_en: str | None = None
    verb_hint: str | None = None
    question_en: str | None = None
    options: list[ChoiceOptionOut] | None = None
    hint_es: str | None = None
    passage_title_en: str | None = None
    passage_en: str | None = None
    task_en: str | None = None
    min_words: int | None = None
    max_words: int | None = None


class LessonExampleOut(Out):
    en: str
    es: str


class LessonContentOut(Out):
    goal_es: str
    concept_es: str
    analogy_es: str
    examples: list[LessonExampleOut]
    spelling_es: list[str] = []
    common_trap_es: str | None = None


class LessonOut(Out):
    slug: str
    version: int
    title_es: str
    level: str | None
    skill_code: str
    skill_name_es: str
    review_status: str
    content: LessonContentOut
    exercises: list[ExerciseOut]


# ── intentos y evaluación ──
class AttemptIn(BaseModel):
    exercise_id: uuid.UUID
    client_submission_id: uuid.UUID = Field(
        description="UUID generado por el cliente; reenviarlo no duplica el intento."
    )
    mode: Literal["practice", "review"]
    answer_text: str | None = Field(default=None, min_length=1, max_length=300)
    option_id: str | None = Field(default=None, min_length=1, max_length=8)
    hint_count: int = Field(default=0, ge=0, le=10)
    retry_of: uuid.UUID | None = None

    @model_validator(mode="after")
    def one_answer(self) -> Self:
        if (self.answer_text is None) == (self.option_id is None):
            raise ValueError("Envía answer_text o option_id (uno de los dos)")
        if self.answer_text is not None and not self.answer_text.strip():
            raise ValueError("answer_text vacío")
        return self


class GradeErrorOut(Out):
    rule_code: str
    explanation_es: str
    span: str | None = None
    minimal_correction: str | None = None


class EvaluationOut(Out):
    id: uuid.UUID
    status: Literal["graded", "needs_review"]
    verdict: Verdict | None
    score: float | None
    max_score: float
    matched_rule: str | None
    feedback_es: str
    explanation_es: str
    expected_answer: str
    correct_sentence: str | None
    your_answer: str
    errors: list[GradeErrorOut]
    confidence: Confidence
    rubric_version: str
    grader_version: str
    review_status: Literal["none", "disputed", "upheld", "overturned"]
    next_action: Literal["continue", "retry"]
    retry_hint_es: str | None = Field(
        default=None, description="Pista SIN la respuesta, para mostrar antes del segundo intento."
    )


class MasteryOut(Out):
    skill_code: str
    skill_name_es: str
    state: MasteryState
    confidence: Confidence
    evidence_count: int
    recent_accuracy: float | None
    distinct_days: int
    rationale_es: str
    algorithm_version: str


class ReviewOut(Out):
    id: uuid.UUID
    skill_code: str
    skill_name_es: str
    due_at: datetime
    interval_days: int
    step: int
    reason: Literal["error", "retention", "review_passed", "review_failed"]
    is_due: bool


class AttemptResultOut(Out):
    attempt_id: uuid.UUID
    idempotent_replay: bool
    evaluation: EvaluationOut
    mastery: MasteryOut
    next_review: ReviewOut | None


class DisputeIn(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


class DisputeOut(Out):
    id: uuid.UUID
    status: Literal["open", "accepted", "rejected"]


# ── progreso / misión / repaso ──
class RecentMistakeOut(Out):
    attempt_id: uuid.UUID
    submitted_at: datetime
    prompt_en: str
    your_answer: str
    verdict: Verdict
    correction: str
    feedback_es: str


class ProgressOut(Out):
    skills: list[MasteryOut]
    reviews: list[ReviewOut]
    recent_mistakes: list[RecentMistakeOut]
    total_attempts: int
    practice_days: list[date] = Field(description="Días con práctica real (últimos 60), en tu zona horaria.")
    streak_days: int = Field(description="Días seguidos con práctica real que terminan hoy o ayer.")
    server_now: datetime


class NextMissionOut(Out):
    kind: Literal["review", "lesson", "diagnostic", "none"]
    title_es: str
    reason_es: str
    href: str | None
    skill_code: str | None
    due_at: datetime | None = None


class ReviewSessionOut(Out):
    due: list[ReviewOut]
    exercises: list[ExerciseOut]
    next_due_at: datetime | None


# ── diagnóstico ──
DiagnosticBlockId = Literal["grammar_vocab", "reading", "writing"]
Band = Literal["not_assessed", "below_a1", "a1", "a2", "pending_review"]


class DiagnosticBlockOut(Out):
    id: DiagnosticBlockId
    title_es: str
    intro_es: str
    index: int
    total_blocks: int


class DiagnosticStateOut(Out):
    run_id: uuid.UUID
    version: str
    status: Literal["in_progress", "completed"]
    answered: int
    total: int
    block: DiagnosticBlockOut | None
    first_in_block: bool
    item: ExerciseOut | None
    not_assessed_es: list[str]


class DiagnosticCurrentOut(Out):
    active: DiagnosticStateOut | None
    last_completed_run_id: uuid.UUID | None


class DiagnosticAnswerIn(BaseModel):
    exercise_id: uuid.UUID
    client_submission_id: uuid.UUID
    answer_text: str | None = Field(default=None, min_length=1, max_length=2000)
    option_id: str | None = Field(default=None, min_length=1, max_length=8)
    unsure: bool = Field(default=False, description="«No lo sé»: mejor que adivinar; cuenta como no logrado.")

    @model_validator(mode="after")
    def one_answer(self) -> Self:
        given = (self.answer_text is not None) + (self.option_id is not None)
        if self.unsure and given:
            raise ValueError("Con unsure=true no se envía respuesta")
        if not self.unsure and given != 1:
            raise ValueError("Envía answer_text u option_id (uno de los dos), o unsure=true")
        return self


class SectionOut(Out):
    skill_code: str
    skill_name_es: str
    domain: str
    band: Band
    band_label_es: str
    confidence: Confidence
    evidence_count: int
    notes_es: str


class MissionOut(Out):
    skill_code: str
    title_es: str
    why_es: str
    href: str | None
    available: bool


class WritingErrorOut(Out):
    span: str
    type: str
    severity: str
    explanation_es: str
    minimal_correction: str


class WritingFeedbackOut(Out):
    exercise_id: uuid.UUID
    task_en: str
    your_text: str
    status: Literal["graded", "needs_review", "pending"]
    feedback_es: str
    criteria: dict[str, dict[str, int | str]] | None
    errors: list[WritingErrorOut]
    natural_version_en: str | None
    notes_es: list[str]


class DiagnosticReportOut(Out):
    run_id: uuid.UUID
    version: str
    completed_at: datetime
    sections: list[SectionOut]
    strengths_es: list[str]
    needs_es: list[str]
    missions: list[MissionOut]
    writing: list[WritingFeedbackOut]
    caveats_es: list[str]
    not_assessed_es: list[str]
    confirmation_suggested: bool
    pending_evaluations: int


# ── Writing Lab ──
class WritingPromptOut(Out):
    id: uuid.UUID
    topic: str
    cefr: str | None
    instruction_es: str
    task_en: str
    min_words: int
    max_words: int


class WritingSubmissionIn(BaseModel):
    exercise_id: uuid.UUID
    client_submission_id: uuid.UUID = Field(description="UUID del cliente; reenviarlo no duplica el texto.")
    text: str = Field(min_length=1, max_length=3000)


class WritingSubmissionOut(Out):
    attempt_id: uuid.UUID
    submitted_at: datetime
    prompt: WritingPromptOut
    feedback: WritingFeedbackOut


# ── tutor ──
class TutorCorrectionOut(Out):
    original: str
    corrected: str
    explanation_es: str


class TutorMessageOut(Out):
    id: uuid.UUID
    role: Literal["user", "assistant"]
    text: str
    corrections: list[TutorCorrectionOut]
    practice_prompt_en: str | None = None
    created_at: datetime


class TutorConversationIn(BaseModel):
    evaluation_id: uuid.UUID | None = Field(default=None, description="Para «explícame este error».")


class TutorConversationOut(Out):
    id: uuid.UUID
    persona: Literal["fun", "calm", "coach"]
    context_title_es: str | None
    messages: list[TutorMessageOut]
    daily_messages_left: int


class TutorMessageIn(BaseModel):
    client_message_id: uuid.UUID
    text: str = Field(min_length=1, max_length=1000)


class TutorTurnOut(Out):
    user_message: TutorMessageOut
    reply: TutorMessageOut
    daily_messages_left: int


# ── revisión de contenido (staff) ──
class DisputeReviewOut(Out):
    id: uuid.UUID
    created_at: datetime
    status: Literal["open", "accepted", "rejected"]
    reason: str
    item_external_id: str
    prompt_en: str
    learner_answer: str
    verdict: Verdict | None
    matched_rule: str | None
    expected_answer: str | None
    feedback_es: str
    rubric_version: str
    grader_version: str


class DisputeResolveIn(BaseModel):
    decision: Literal["accept", "reject"]
    note: str = Field(min_length=3, max_length=500)


class AiUsageOut(Out):
    period_start: datetime
    requests: int
    ok: int
    invalid_output: int
    errors: int
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float | None
    cost_known_for_all: bool
    p50_latency_ms: int | None
    p95_latency_ms: int | None


# ── Listening Lab ──
class EpisodeSummaryOut(Out):
    slug: str
    title_es: str
    context_es: str
    level: str
    topic: str
    speakers: list[str]
    questions: int
    solved: int


class ListeningSegmentOut(Out):
    speaker: str
    text_en: str


class ListeningQuestionOut(Out):
    exercise_id: uuid.UUID
    question_en: str
    instruction_es: str
    options: list[ChoiceOptionOut]
    segment: int
    solved: bool


class DictationOut(Out):
    segment: int
    before: str
    answer: str
    after: str


class EpisodeOut(Out):
    slug: str
    title_es: str
    context_es: str
    level: str
    topic: str
    speakers: list[str]
    segments: list[ListeningSegmentOut]
    questions: list[ListeningQuestionOut]
    dictation: DictationOut | None
    server_audio: bool = Field(description="Hay voz del servidor; si no, la app usa la voz del navegador.")


# ── Speaking Lab ──
class ScenarioSummaryOut(Out):
    slug: str
    title_es: str
    context_es: str
    level: str
    topic: str
    steps: int


class SpeakingPromptOut(Out):
    step: int
    total: int
    lania_en: str
    goal_es: str | None
    useful_phrases_en: list[str]
    finished: bool


class SpeakingTurnOut(Out):
    id: uuid.UUID
    step: int
    input_mode: Literal["voice", "text"]
    transcript: str
    on_task: bool
    corrections: list[TutorCorrectionOut]
    natural_version_en: str | None
    feedback_es: str
    reply_en: str


class SpeakingSessionOut(Out):
    id: uuid.UUID
    scenario: ScenarioSummaryOut
    role_es: str
    current: SpeakingPromptOut
    turns: list[SpeakingTurnOut]
    voice_input: bool
    voice_output: bool


class SpeakingStartIn(BaseModel):
    scenario: str = Field(pattern=r"^[a-z0-9-]{2,40}$")


# ── Salones (base; desactivados en el piloto) ──
class RoomOut(Out):
    id: uuid.UUID
    slug: str
    title_es: str
    topic_es: str
    goal_es: str
    level: str
    capacity: int
    members: int
    starts_at: datetime | None
    status: Literal["scheduled", "open", "closed"]
    joined: bool


class RoomMessageOut(Out):
    id: uuid.UUID
    author: str
    mine: bool
    kind: Literal["text", "voice", "lania"]
    text: str
    created_at: datetime


class RoomMessageIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


# ── Misiones ──
class MissionStepOut(Out):
    kind: Literal["lesson", "listening", "reading", "writing", "speaking"]
    title_es: str
    href: str
    state: Literal["done", "now", "todo"]


class MissionProgressOut(Out):
    slug: str
    title_es: str
    situation_es: str
    level: str
    topic: str
    icon: Literal["briefcase", "plane", "users", "coffee"]
    steps: list[MissionStepOut]
    done: int
    recommended: bool


# ── Comentarios del piloto ──
FeedbackKind = Literal["bug", "idea", "content", "other"]


class FeedbackIn(BaseModel):
    kind: FeedbackKind = "bug"
    message: str = Field(min_length=3, max_length=2000)
    page: str | None = Field(default=None, max_length=200, pattern=r"^/[A-Za-z0-9/_\-?=&.%]*$")


class FeedbackOut(Out):
    id: uuid.UUID
    kind: FeedbackKind
    message: str
    page: str | None
    status: Literal["new", "seen", "done"]
    author: str | None
    created_at: datetime


# ── Reading Lab ──
class ReadingSummaryOut(Out):
    slug: str
    title_en: str
    title_es: str
    kind_es: str
    level: str
    topic: str
    words: int
    minutes: int
    questions: int
    solved: int


class GlossaryOut(Out):
    en: str
    es: str


class ReadingQuestionOut(Out):
    exercise_id: uuid.UUID
    question_en: str
    instruction_es: str
    options: list[ChoiceOptionOut]
    paragraph: int
    solved: bool


class ReadingOut(Out):
    slug: str
    title_en: str
    title_es: str
    kind_es: str
    level: str
    topic: str
    words: int
    paragraphs: list[str]
    glossary: list[GlossaryOut]
    questions: list[ReadingQuestionOut]
    server_audio: bool
