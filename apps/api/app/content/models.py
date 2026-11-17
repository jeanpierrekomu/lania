"""Esquema del banco de ítems y lecciones (YAML → Pydantic). Valida calidad mínima del contenido."""

from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.grading.normalize import normalize

Person = Literal["1s", "2s", "3s", "1p", "2p", "3p"]
ReviewStatus = Literal["draft", "pilot", "approved", "retired"]
Pool = Literal[
    "practice", "diagnostic", "writing_lab", "listening", "reading"
]  # solo «practice» entra en lecciones y repasos
Tense = Literal["present_simple", "present_continuous", "past_simple", "future_will", "infinitive", "other"]
BLANK = "___"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class VerbForms(Strict):
    base: str
    third: str
    ing: str


class Alternative(Strict):
    answers: list[str] = Field(min_length=1)
    verdict: Literal["valid_alternative", "less_natural", "partial"]
    rule: str
    feedback_es: str
    retry_hint_es: str | None = None  # pista SIN la respuesta, para antes del reintento


class Distractor(Strict):
    answers: list[str] = Field(min_length=1)
    rule: str
    feedback_es: str
    minimal_correction: str | None = None
    retry_hint_es: str | None = None  # pista SIN la respuesta, para antes del reintento


class FillBlankPrompt(Strict):
    instruction_es: str
    sentence_en: str
    verb_hint: str | None = None
    hint_es: str | None = None

    @model_validator(mode="after")
    def one_blank(self) -> Self:
        if self.sentence_en.count(BLANK) != 1:
            raise ValueError(f"sentence_en debe contener exactamente un {BLANK}")
        return self


class FillBlankAnswer(Strict):
    subject: Person
    polarity: Literal["affirmative", "negative", "question"] = "affirmative"
    # Los diagnósticos genéricos por regla (ADR-004) solo se aplican a present_simple.
    tense: Tense = "present_simple"
    verb: VerbForms | None = None
    accepted: list[str] = Field(min_length=1)
    explanation_es: str
    alternatives: list[Alternative] = []
    distractors: list[Distractor] = []

    @model_validator(mode="after")
    def no_overlap(self) -> Self:
        """Una misma respuesta no puede ser a la vez clave, alternativa y distractor."""
        seen: dict[str, str] = {}
        groups: list[tuple[str, list[str]]] = [("accepted", self.accepted)]
        groups += [(f"alternative:{a.rule}", a.answers) for a in self.alternatives]
        groups += [(f"distractor:{d.rule}", d.answers) for d in self.distractors]
        for label, answers in groups:
            for answer in answers:
                key = normalize(answer)
                if key in seen:
                    raise ValueError(f"«{answer}» aparece en {seen[key]} y en {label}")
                seen[key] = label
        return self


class ChoiceOption(Strict):
    id: str
    text: str


class ChoicePrompt(Strict):
    instruction_es: str
    question_en: str
    passage_title_en: str | None = None
    passage_en: str | None = None  # lectura: el texto se muestra junto a la pregunta
    options: list[ChoiceOption] = Field(min_length=2, max_length=6)
    hint_es: str | None = None


class OptionFeedback(Strict):
    rule: str
    feedback_es: str
    retry_hint_es: str | None = None


class ChoiceAnswer(Strict):
    correct_option: str
    explanation_es: str
    option_feedback: dict[str, OptionFeedback]


class OpenResponsePrompt(Strict):
    """Escritura libre: se evalúa con rúbrica (writing_v1) por IA + validación, nunca por coincidencia."""

    instruction_es: str
    task_en: str
    min_words: int = Field(ge=5, le=200)
    max_words: int = Field(ge=10, le=400)


class OpenResponseAnswer(Strict):
    rubric: Literal["writing_v1"]
    expected_level: str
    focus_skills: list[str] = Field(min_length=1)  # p. ej. writing.task_fulfillment, grammar.*
    reviewer_notes_es: str  # qué debería contener una respuesta que cumple la tarea (para revisores/IA)


class ItemSpec(Strict):
    id: str
    version: int = Field(ge=1)
    skill: str
    pool: Pool = "practice"
    type: Literal["fill_blank", "choice", "open_response"]
    cefr_estimate: str | None = None
    difficulty: int = Field(ge=1, le=5)
    rubric_version: str
    license: str
    review_status: ReviewStatus
    prompt: FillBlankPrompt | ChoicePrompt | OpenResponsePrompt
    answer: FillBlankAnswer | ChoiceAnswer | OpenResponseAnswer

    @model_validator(mode="after")
    def consistent_type(self) -> Self:
        if self.type == "fill_blank":
            if not isinstance(self.prompt, FillBlankPrompt) or not isinstance(self.answer, FillBlankAnswer):
                raise ValueError(f"{self.id}: fill_blank requiere prompt/answer de fill_blank")
        elif self.type == "open_response":
            if not isinstance(self.prompt, OpenResponsePrompt) or not isinstance(self.answer, OpenResponseAnswer):
                raise ValueError(f"{self.id}: open_response requiere prompt/answer de open_response")
            if self.prompt.min_words >= self.prompt.max_words:
                raise ValueError(f"{self.id}: min_words debe ser menor que max_words")
        else:
            if not isinstance(self.prompt, ChoicePrompt) or not isinstance(self.answer, ChoiceAnswer):
                raise ValueError(f"{self.id}: choice requiere prompt/answer de choice")
            option_ids = {o.id for o in self.prompt.options}
            if len(option_ids) != len(self.prompt.options):
                raise ValueError(f"{self.id}: ids de opciones repetidos")
            if self.answer.correct_option not in option_ids:
                raise ValueError(f"{self.id}: correct_option no existe")
            wrong = option_ids - {self.answer.correct_option}
            if set(self.answer.option_feedback) != wrong:
                raise ValueError(f"{self.id}: cada opción incorrecta necesita feedback (y solo ellas)")
        return self


class LessonExample(Strict):
    en: str
    es: str


class LessonContent(Strict):
    goal_es: str
    concept_es: str
    analogy_es: str
    examples: list[LessonExample] = Field(min_length=2, max_length=3)
    spelling_es: list[str] = []
    common_trap_es: str | None = None


class LessonItemRef(Strict):
    id: str
    role: Literal["warmup", "practice"]


class LessonSpec(Strict):
    slug: str
    version: int = Field(ge=1)
    title_es: str
    level: str | None = None
    skill: str
    review_status: ReviewStatus
    content: LessonContent
    items: list[LessonItemRef] = Field(min_length=1)


class SkillSpec(Strict):
    code: str
    domain: Literal["grammar", "vocabulary", "listening", "speaking", "writing", "reading"]
    cefr_range: str | None = None
    name_es: str
    description_es: str
    prerequisites: list[str] = []
    rubric_version: str | None = None


class DiagnosticBlock(Strict):
    id: Literal["grammar_vocab", "reading", "writing"]
    title_es: str
    intro_es: str
    items: list[str] = Field(min_length=1)


class DiagnosticSpec(Strict):
    """Diagnóstico versionado (diag_v1). Orden de ítems dentro de cada habilidad: A1 primero, luego A2."""

    version: str
    title_es: str
    blocks: list[DiagnosticBlock] = Field(min_length=1)
    not_assessed_es: list[str] = []  # destrezas que este diagnóstico NO mide (se dice en el informe)


# ── Listening Lab ──
class ListeningSpeaker(Strict):
    name: str
    voice: str  # voz del proveedor TTS (p. ej. marin, cedar); se valida contra la configuración al sintetizar


class ListeningSegment(Strict):
    speaker: str
    text_en: str = Field(min_length=1, max_length=400)


class ListeningDictation(Strict):
    segment: int = Field(ge=0)
    before: str
    answer: str = Field(min_length=1)
    after: str


class EpisodeSpec(Strict):
    """Episodio de escucha original: diálogo por segmentos + preguntas (ítems choice, pool listening)."""

    slug: str = Field(pattern=r"^[a-z0-9-]{2,40}$")
    version: int = Field(ge=1)
    title_es: str
    context_es: str
    level: str
    topic: str
    review_status: ReviewStatus
    speakers: list[ListeningSpeaker] = Field(min_length=1, max_length=3)
    segments: list[ListeningSegment] = Field(min_length=2, max_length=20)
    # Cada pregunta: id del ítem + segmento donde se escucha la respuesta (para «escuchar de nuevo»).
    questions: dict[str, int] = Field(min_length=1)
    dictation: ListeningDictation | None = None

    @model_validator(mode="after")
    def consistent(self) -> Self:
        names = {s.name for s in self.speakers}
        for seg in self.segments:
            if seg.speaker not in names:
                raise ValueError(f"{self.slug}: hablante desconocido {seg.speaker}")
        if any(i >= len(self.segments) for i in self.questions.values()):
            raise ValueError(f"{self.slug}: una pregunta apunta a un segmento inexistente")
        if self.dictation:
            idx = self.dictation.segment
            full = f"{self.dictation.before}{self.dictation.answer}{self.dictation.after}"
            if idx >= len(self.segments) or full.strip() != self.segments[idx].text_en.strip():
                raise ValueError(f"{self.slug}: el dictado debe reconstruir exactamente su segmento")
        return self


# ── Reading Lab ──
class GlossaryEntry(Strict):
    en: str = Field(min_length=1, max_length=40)  # tal como aparece en el texto (se resalta)
    es: str = Field(min_length=1, max_length=120)


class ReadingSpec(Strict):
    """Lectura original por párrafos + glosario + preguntas (ítems choice, pool reading)."""

    slug: str = Field(pattern=r"^[a-z0-9-]{2,40}$")
    version: int = Field(ge=1)
    title_en: str
    title_es: str
    kind_es: str  # «Correo», «Anuncio de trabajo», «Artículo»… (tipo de texto real)
    level: str
    topic: str
    review_status: ReviewStatus
    paragraphs: list[str] = Field(min_length=1, max_length=8)
    glossary: list[GlossaryEntry] = Field(default_factory=list, max_length=15)
    # Cada pregunta: id del ítem + párrafo donde está la respuesta (para «ver en el texto»).
    questions: dict[str, int] = Field(min_length=1)

    @model_validator(mode="after")
    def consistent(self) -> Self:
        if any(i >= len(self.paragraphs) for i in self.questions.values()):
            raise ValueError(f"{self.slug}: una pregunta apunta a un párrafo inexistente")
        text = " ".join(self.paragraphs).lower()
        for g in self.glossary:
            if g.en.lower() not in text:
                raise ValueError(f"{self.slug}: «{g.en}» del glosario no aparece en el texto")
        return self


# ── Speaking Lab ──
class SpeakingStep(Strict):
    lania_en: str  # lo que dice Lania para abrir este paso
    goal_es: str  # qué tiene que lograr la persona en su turno
    useful_phrases_en: list[str] = Field(min_length=1, max_length=5)


class ScenarioSpec(Strict):
    """Conversación guiada por pasos: Lania interpreta un rol, la persona responde por voz o por escrito."""

    slug: str = Field(pattern=r"^[a-z0-9-]{2,40}$")
    version: int = Field(ge=1)
    title_es: str
    context_es: str
    level: str
    topic: str
    review_status: ReviewStatus
    lania_role_en: str  # rol de Lania en la escena (p. ej. "a friendly HR recruiter")
    steps: list[SpeakingStep] = Field(min_length=2, max_length=8)
    closing_en: str


# ── Misiones ──
class MissionStep(Strict):
    kind: Literal["lesson", "listening", "reading", "writing", "speaking"]
    ref: str  # slug de lección/episodio/escenario o id de consigna del Writing Lab
    title_es: str


class MissionSpec(Strict):
    """Situación real que encadena actividades existentes. El avance se mide con evidencia, sin puntos."""

    slug: str = Field(pattern=r"^[a-z0-9-]{2,40}$")
    version: int = Field(ge=1)
    title_es: str
    situation_es: str
    level: str
    topic: str
    icon: Literal["briefcase", "plane", "users", "coffee"]
    review_status: ReviewStatus
    steps: list[MissionStep] = Field(min_length=2, max_length=8)
