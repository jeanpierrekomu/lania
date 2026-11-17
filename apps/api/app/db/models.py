"""Mapeo ORM de tablas creadas por `supabase/migrations` (ADR-001). NO crea esquema.

`tests/integration/test_schema.py` verifica que cada columna mapeada exista en la base.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import ForeignKey, LargeBinary, MetaData, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    metadata = MetaData(schema="public")


class AuthUser(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}  # noqa: RUF012
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str | None]


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"), primary_key=True)
    display_name: Mapped[str | None]
    locale: Mapped[str]
    timezone: Mapped[str]
    role: Mapped[str]
    audio_retention_consent: Mapped[bool]
    pilot_consent_at: Mapped[datetime | None]


class LearnerGoals(Base):
    __tablename__ = "learner_goals"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"), primary_key=True)
    goal: Mapped[str]
    self_level: Mapped[str]
    interests: Mapped[list[str]] = mapped_column(ARRAY(Text))
    session_minutes: Mapped[int]
    onboarded_at: Mapped[datetime]


class LearningPreferences(Base):
    __tablename__ = "learning_preferences"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"), primary_key=True)
    tutor_persona: Mapped[str]
    feedback_intensity: Mapped[str]
    lesson_duration_min: Mapped[int]
    audio_speed: Mapped[Decimal]
    translation_support: Mapped[str]
    low_stim_mode: Mapped[bool]
    topics: Mapped[list[str]] = mapped_column(ARRAY(Text))
    humor_level: Mapped[int] = mapped_column(default=3)
    show_avatar: Mapped[bool] = mapped_column(default=True)
    reduce_motion: Mapped[bool] = mapped_column(default=False)


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str]
    domain: Mapped[str]
    cefr_range: Mapped[str | None]
    name_es: Mapped[str]
    description_es: Mapped[str]
    prerequisites: Mapped[list[str]] = mapped_column(ARRAY(Text))
    rubric_version: Mapped[str | None]


class ExerciseItem(Base):
    __tablename__ = "exercise_items"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    external_id: Mapped[str]
    version: Mapped[int]
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id"))
    type: Mapped[str]
    cefr_estimate: Mapped[str | None]
    difficulty: Mapped[int]
    prompt: Mapped[dict[str, Any]] = mapped_column(JSONB)
    answer_schema: Mapped[dict[str, Any]] = mapped_column(JSONB)
    rubric_version: Mapped[str]
    license: Mapped[str]
    review_status: Mapped[str]
    published: Mapped[bool]
    pool: Mapped[str] = mapped_column(default="practice")


class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slug: Mapped[str]
    version: Mapped[int]
    title_es: Mapped[str]
    level: Mapped[str | None]
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id"))
    content: Mapped[dict[str, Any]] = mapped_column(JSONB)
    review_status: Mapped[str]
    published: Mapped[bool]


class LessonItem(Base):
    __tablename__ = "lesson_items"
    lesson_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lessons.id"), primary_key=True)
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercise_items.id"), primary_key=True)
    position: Mapped[int]
    role: Mapped[str]


class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercise_items.id"))
    client_submission_id: Mapped[uuid.UUID]
    mode: Mapped[str]
    original_answer: Mapped[str]
    hint_count: Mapped[int]
    retry_of: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("attempts.id"))
    submitted_at: Mapped[datetime]


class Evaluation(Base):
    __tablename__ = "evaluations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    attempt_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("attempts.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    status: Mapped[str]
    verdict: Mapped[str | None]
    score: Mapped[Decimal | None]
    max_score: Mapped[Decimal]
    matched_rule: Mapped[str | None]
    expected_answer: Mapped[str | None]
    errors: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    feedback_es: Mapped[str]
    grader: Mapped[str]
    grader_version: Mapped[str]
    rubric_version: Mapped[str]
    confidence: Mapped[str]
    review_status: Mapped[str]
    created_at: Mapped[datetime]
    model_id: Mapped[str | None] = mapped_column(default=None)
    ai_request_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ai_requests.id"), default=None)
    criteria_scores: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=None)
    strengths_es: Mapped[str | None] = mapped_column(default=None)
    natural_version_en: Mapped[str | None] = mapped_column(default=None)
    retry_hint_es: Mapped[str | None] = mapped_column(default=None)


class EvaluationDispute(Base):
    __tablename__ = "evaluation_disputes"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    evaluation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("evaluations.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    reason: Mapped[str]
    status: Mapped[str]
    created_at: Mapped[datetime]
    resolved_at: Mapped[datetime | None] = mapped_column(default=None)
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("auth.users.id"), default=None)
    resolution_note: Mapped[str | None] = mapped_column(default=None)


class SkillEvidence(Base):
    __tablename__ = "skill_evidence"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id"))
    attempt_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("attempts.id"))
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercise_items.id"))
    context: Mapped[str]
    hint_count: Mapped[int]
    difficulty: Mapped[int]
    result: Mapped[str]
    created_at: Mapped[datetime]


class SkillMastery(Base):
    __tablename__ = "skill_mastery"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"), primary_key=True)
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id"), primary_key=True)
    state: Mapped[str]
    confidence: Mapped[str]
    evidence_count: Mapped[int]
    recent_accuracy: Mapped[Decimal | None]
    distinct_days: Mapped[int]
    rationale_es: Mapped[str | None]
    algorithm_version: Mapped[str]
    last_assessed_at: Mapped[datetime | None]
    updated_at: Mapped[datetime]


class ReviewSchedule(Base):
    __tablename__ = "review_schedule"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id"))
    due_at: Mapped[datetime]
    step: Mapped[int]
    interval_days: Mapped[int]
    status: Mapped[str]
    outcome: Mapped[str | None]
    reason: Mapped[str]
    source_attempt_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("attempts.id"))
    algorithm_version: Mapped[str]
    created_at: Mapped[datetime]
    completed_at: Mapped[datetime | None]


class AiRequest(Base):
    __tablename__ = "ai_requests"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("auth.users.id"))
    task: Mapped[str]
    provider: Mapped[str]
    model: Mapped[str]
    prompt_version: Mapped[str]
    request_key: Mapped[str | None]
    input_tokens: Mapped[int | None]
    output_tokens: Mapped[int | None]
    estimated_cost_usd: Mapped[Decimal | None]
    latency_ms: Mapped[int | None]
    status: Mapped[str]
    error_code: Mapped[str | None]
    created_at: Mapped[datetime]


class DiagnosticRun(Base):
    __tablename__ = "diagnostic_runs"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    version: Mapped[str]
    status: Mapped[str]
    started_at: Mapped[datetime]
    completed_at: Mapped[datetime | None]
    report: Mapped[dict[str, Any] | None] = mapped_column(JSONB)


class DiagnosticRunItem(Base):
    __tablename__ = "diagnostic_run_items"
    run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("diagnostic_runs.id"), primary_key=True)
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercise_items.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    position: Mapped[int]
    block: Mapped[str]
    status: Mapped[str]
    skip_reason: Mapped[str | None]
    attempt_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("attempts.id"))


class DiagnosticSection(Base):
    __tablename__ = "diagnostic_sections"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("diagnostic_runs.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id"))
    band: Mapped[str]
    confidence: Mapped[str]
    evidence_count: Mapped[int]
    correct_count: Mapped[Decimal]
    notes_es: Mapped[str | None]
    algorithm_version: Mapped[str]


class TutorConversation(Base):
    __tablename__ = "tutor_conversations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    persona: Mapped[str]
    context: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
    expires_at: Mapped[datetime]


class TutorMessage(Base):
    __tablename__ = "tutor_messages"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tutor_conversations.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    role: Mapped[str]
    text: Mapped[str]
    corrections: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    client_message_id: Mapped[uuid.UUID | None]
    ai_request_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ai_requests.id"))
    created_at: Mapped[datetime]


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("auth.users.id"))
    action: Mapped[str]
    object_type: Mapped[str]
    object_id: Mapped[uuid.UUID | None]
    metadata_safe: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime]


class TtsCache(Base):
    __tablename__ = "tts_cache"
    key: Mapped[str] = mapped_column(primary_key=True)
    kind: Mapped[str]
    model: Mapped[str]
    voice: Mapped[str]
    mime: Mapped[str]
    data: Mapped[bytes] = mapped_column(LargeBinary)
    created_at: Mapped[datetime]


class SpeakingSession(Base):
    __tablename__ = "speaking_sessions"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    scenario: Mapped[str]
    step: Mapped[int]
    finished_at: Mapped[datetime | None]
    created_at: Mapped[datetime]


class SpeakingTurn(Base):
    __tablename__ = "speaking_turns"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("speaking_sessions.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"))
    client_turn_id: Mapped[uuid.UUID]
    step: Mapped[int]
    input_mode: Mapped[str]
    transcript: Mapped[str]
    audio_seconds: Mapped[Decimal | None]
    feedback: Mapped[dict[str, Any]] = mapped_column(JSONB)
    reply_en: Mapped[str]
    ai_request_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ai_requests.id"))
    created_at: Mapped[datetime]


class Room(Base):
    __tablename__ = "rooms"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slug: Mapped[str]
    title_es: Mapped[str]
    topic_es: Mapped[str]
    goal_es: Mapped[str]
    level: Mapped[str]
    capacity: Mapped[int]
    starts_at: Mapped[datetime | None]
    ends_at: Mapped[datetime | None]
    status: Mapped[str]
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("auth.users.id"))
    created_at: Mapped[datetime]


class RoomMember(Base):
    __tablename__ = "room_members"
    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id"), primary_key=True)
    role: Mapped[str]
    joined_at: Mapped[datetime]
    left_at: Mapped[datetime | None]


class RoomMessage(Base):
    __tablename__ = "room_messages"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("auth.users.id"))
    kind: Mapped[str]
    text: Mapped[str]
    reported_at: Mapped[datetime | None]
    hidden_at: Mapped[datetime | None]
    created_at: Mapped[datetime]


class PilotFeedback(Base):
    __tablename__ = "pilot_feedback"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("auth.users.id"))
    kind: Mapped[str]
    message: Mapped[str]
    page: Mapped[str | None]
    status: Mapped[str]
    created_at: Mapped[datetime]
