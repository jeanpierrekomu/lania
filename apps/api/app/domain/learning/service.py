"""Casos de uso del vertical slice. Toda escritura de evidencia/dominio/repaso pasa por aquí.

El `user_id` siempre viene del JWT verificado (ADR-002), nunca del cuerpo de la petición.
"""

import hashlib
import uuid
from datetime import date, datetime, timedelta
from typing import Any, cast
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1 import schemas as s
from app.content.models import ChoiceAnswer, ChoicePrompt, FillBlankAnswer, FillBlankPrompt
from app.core.errors import ApiError
from app.db.models import (
    Attempt,
    AuthUser,
    DiagnosticRun,
    Evaluation,
    EvaluationDispute,
    ExerciseItem,
    LearnerGoals,
    LearningPreferences,
    Lesson,
    LessonItem,
    Profile,
    ReviewSchedule,
    Skill,
    SkillEvidence,
    SkillMastery,
    SpeakingTurn,
    TutorMessage,
)
from app.domain.grading.closed import (
    GRADER,
    GRADER_VERSION,
    GradeResult,
    fill_sentence,
    grade_choice,
    grade_fill_blank,
)
from app.domain.learning.hints import retry_hint
from app.domain.mastery import rules as mastery_rules
from app.domain.reviews import scheduler

VERDICT_TO_RESULT = {
    "correct": "correct",
    "valid_alternative": "correct",
    "less_natural": "correct",
    "spelling_error": "partial",
    "partial": "partial",
    "incorrect": "incorrect",
}
REVIEW_ITEMS_PER_SKILL = scheduler.ITEMS_TO_PASS_REVIEW
DEFAULT_LESSON = "present-simple-basics"
LESSON_ORDER = ["present-simple-basics", "past-simple-did", "future-will"]
LESSON_WHY = {
    "present-simple-basics": "Empezamos por el presente simple: es la base de «I study / she works» y de las "
    "preguntas con do/does, donde suelen aparecer los primeros errores.",
    "past-simple-did": "Pasado con did/didn't: el error «Did you went?» o «I not finished» es de los más comunes.",
    "future-will": "Futuro con will + verbo base: evita «will studying» o «will to call».",
}


# ───────────────────────────── usuarios ─────────────────────────────


def get_or_create_local_user(db: Session, email: str, display_name: str | None) -> uuid.UUID:
    email = email.strip().lower()
    user = db.scalar(select(AuthUser).where(AuthUser.email == email))
    if user is None:
        user = AuthUser(id=uuid.uuid4(), email=email)
        db.add(user)
        db.flush()  # el trigger handle_new_user crea profile + preferences
    if display_name:
        profile = db.get(Profile, user.id)
        if profile is not None and not profile.display_name:
            profile.display_name = display_name.strip()
    return user.id


def get_me(db: Session, user_id: uuid.UUID) -> s.MeOut:
    profile = db.get(Profile, user_id)
    prefs = db.get(LearningPreferences, user_id)
    if profile is None or prefs is None:
        raise ApiError(404, "NOT_FOUND", "No encontramos tu perfil.")
    goals = db.get(LearnerGoals, user_id)
    return s.MeOut(
        id=profile.id,
        display_name=profile.display_name,
        locale=profile.locale,
        timezone=profile.timezone,
        role=profile.role,
        pilot_consent_at=profile.pilot_consent_at,
        onboarding=s.OnboardingOut.model_validate(goals) if goals else None,
        preferences=s.PreferencesOut.model_validate(prefs),
    )


def update_preferences(db: Session, user_id: uuid.UUID, payload: s.PreferencesIn) -> s.MeOut:
    prefs = db.get(LearningPreferences, user_id)
    if prefs is None:
        raise ApiError(404, "NOT_FOUND", "No encontramos tus preferencias.")
    for key, value in payload.model_dump().items():
        setattr(prefs, key, value)
    db.flush()
    return get_me(db, user_id)


# ───────────────────────────── contenido ─────────────────────────────


def _exercise_out(item: ExerciseItem, skill_code: str, role: str) -> s.ExerciseOut:
    p: dict[str, Any] = item.prompt
    return s.ExerciseOut(
        id=item.id,
        external_id=item.external_id,
        version=item.version,
        type=item.type,
        skill_code=skill_code,
        difficulty=item.difficulty,
        role=role,
        instruction_es=p["instruction_es"],
        sentence_en=p.get("sentence_en"),
        verb_hint=p.get("verb_hint"),
        question_en=p.get("question_en"),
        hint_es=None if role == "diagnostic" else p.get("hint_es"),  # modo examen: sin pistas
        options=[s.ChoiceOptionOut(**o) for o in p["options"]] if "options" in p else None,
        passage_title_en=p.get("passage_title_en"),
        passage_en=p.get("passage_en"),
        task_en=p.get("task_en"),
        min_words=p.get("min_words"),
        max_words=p.get("max_words"),
    )


def get_lesson(db: Session, slug: str) -> s.LessonOut:
    lesson = db.scalar(
        select(Lesson).where(Lesson.slug == slug, Lesson.published).order_by(Lesson.version.desc()).limit(1)
    )
    if lesson is None:
        raise ApiError(404, "NOT_FOUND", "Esa lección no existe o aún no está publicada.")
    skill = db.get_one(Skill, lesson.skill_id)
    rows = db.execute(
        select(ExerciseItem, LessonItem.role)
        .join(LessonItem, LessonItem.exercise_id == ExerciseItem.id)
        .where(LessonItem.lesson_id == lesson.id, ExerciseItem.published)
        .order_by(LessonItem.position)
    ).all()
    return s.LessonOut(
        slug=lesson.slug,
        version=lesson.version,
        title_es=lesson.title_es,
        level=lesson.level,
        skill_code=skill.code,
        skill_name_es=skill.name_es,
        review_status=lesson.review_status,
        content=s.LessonContentOut.model_validate(lesson.content),
        exercises=[_exercise_out(item, skill.code, role) for item, role in rows],
    )


# ───────────────────────────── intentos ─────────────────────────────


def _grade(item: ExerciseItem, payload: s.AttemptIn | s.DiagnosticAnswerIn) -> tuple[GradeResult, str, str | None]:
    """Devuelve (resultado, respuesta original, oración correcta)."""
    if item.type == "fill_blank":
        if payload.answer_text is None:
            raise ApiError(422, "INVALID_INPUT", "Este ejercicio necesita una respuesta escrita.")
        fb_prompt = FillBlankPrompt.model_validate(item.prompt)
        fb_answer = FillBlankAnswer.model_validate(item.answer_schema)
        result = grade_fill_blank(fb_prompt, fb_answer, payload.answer_text)
        return (
            result,
            payload.answer_text.strip(),
            fill_sentence(fb_prompt.sentence_en, result.expected_answer),
        )
    if payload.option_id is None:
        raise ApiError(422, "INVALID_INPUT", "Este ejercicio necesita que elijas una opción.")
    ch_prompt = ChoicePrompt.model_validate(item.prompt)
    ch_answer = ChoiceAnswer.model_validate(item.answer_schema)
    try:
        result = grade_choice(ch_prompt, ch_answer, payload.option_id)
    except ValueError as exc:
        raise ApiError(422, "INVALID_INPUT", "Esa opción no existe.") from exc
    question = ch_prompt.question_en
    correct = question.replace("___", result.expected_answer) if "___" in question else None
    return result, payload.option_id, correct


def _explanation(item: ExerciseItem) -> str:
    return str(item.answer_schema.get("explanation_es", ""))


def _evaluation_out(ev: Evaluation, item: ExerciseItem, your_answer: str, retry_used: bool) -> s.EvaluationOut:
    p = item.prompt
    option_id = your_answer if item.type == "choice" else None
    errors = [
        s.GradeErrorOut(
            rule_code=e.get("rule_code") or f"writing.{e.get('type', 'error')}",
            explanation_es=e["explanation_es"],
            span=e.get("span"),
            minimal_correction=e.get("minimal_correction"),
        )
        for e in ev.errors
    ]
    if item.type == "fill_blank":
        correct_sentence: str | None = fill_sentence(p["sentence_en"], ev.expected_answer or "")
    elif item.type == "open_response":
        correct_sentence = ev.natural_version_en
    else:
        q = p["question_en"]
        correct_sentence = q.replace("___", ev.expected_answer or "") if "___" in q else None
        your_answer = next((o["text"] for o in p["options"] if o["id"] == your_answer), your_answer)
    needs_retry = (
        ev.verdict in ("incorrect", "partial", "spelling_error") and not retry_used and item.type != "open_response"
    )
    return s.EvaluationOut(
        id=ev.id,
        status=ev.status,
        verdict=ev.verdict,
        score=float(ev.score) if ev.score is not None else None,
        max_score=float(ev.max_score),
        matched_rule=ev.matched_rule,
        feedback_es=ev.feedback_es,
        explanation_es=_explanation(item),
        expected_answer=ev.expected_answer or "",
        correct_sentence=correct_sentence,
        your_answer=your_answer,
        errors=errors,
        confidence=ev.confidence,
        rubric_version=ev.rubric_version,
        grader_version=ev.grader_version,
        review_status=ev.review_status,
        next_action="retry" if needs_retry else "continue",
        retry_hint_es=retry_hint(item.answer_schema, ev.matched_rule, option_id) if needs_retry else None,
    )


def _pending_review(db: Session, user_id: uuid.UUID, skill_id: uuid.UUID, lock: bool = False) -> ReviewSchedule | None:
    q = select(ReviewSchedule).where(
        ReviewSchedule.user_id == user_id,
        ReviewSchedule.skill_id == skill_id,
        ReviewSchedule.status == "pending",
    )
    return db.scalar(q.with_for_update() if lock else q)


def _review_out(r: ReviewSchedule, skill: Skill, now: datetime) -> s.ReviewOut:
    return s.ReviewOut(
        id=r.id,
        skill_code=skill.code,
        skill_name_es=skill.name_es,
        due_at=r.due_at,
        interval_days=r.interval_days,
        step=r.step,
        reason=r.reason,
        is_due=r.due_at <= now,
    )


def _mastery_out(skill: Skill, m: SkillMastery | None, pending: ReviewSchedule | None, now: datetime) -> s.MasteryOut:
    if m is None:
        a = mastery_rules.assess([])
        return s.MasteryOut(
            skill_code=skill.code,
            skill_name_es=skill.name_es,
            state=a.state,
            confidence=a.confidence,
            evidence_count=0,
            recent_accuracy=None,
            distinct_days=0,
            rationale_es=a.rationale_es,
            algorithm_version=a.algorithm_version,
        )
    state = mastery_rules.effective_state(m.state, pending.due_at if pending else None, now)  # type: ignore[arg-type]
    return s.MasteryOut(
        skill_code=skill.code,
        skill_name_es=skill.name_es,
        state=state,
        confidence=m.confidence,
        evidence_count=m.evidence_count,
        recent_accuracy=float(m.recent_accuracy) if m.recent_accuracy is not None else None,
        distinct_days=m.distinct_days,
        rationale_es=m.rationale_es or "",
        algorithm_version=m.algorithm_version,
    )


def _update_mastery(db: Session, user_id: uuid.UUID, skill_id: uuid.UUID, now: datetime) -> SkillMastery:
    profile = db.get_one(Profile, user_id)
    rows = db.scalars(
        select(SkillEvidence)
        .where(SkillEvidence.user_id == user_id, SkillEvidence.skill_id == skill_id)
        .order_by(SkillEvidence.created_at.desc())
        .limit(200)
    ).all()
    points = [
        mastery_rules.EvidencePoint(
            result=cast(mastery_rules.Result, r.result),
            context=r.context,  # type: ignore[arg-type]
            hint_count=r.hint_count,
            exercise_id=str(r.exercise_id),
            created_at=r.created_at,
        )
        for r in rows
    ]
    a = mastery_rules.assess(points, profile.timezone)
    m = db.get(SkillMastery, (user_id, skill_id)) or SkillMastery(user_id=user_id, skill_id=skill_id)
    m.state, m.confidence, m.evidence_count = a.state, a.confidence, a.evidence_count
    m.recent_accuracy = None if a.recent_accuracy is None else round(a.recent_accuracy, 3)  # type: ignore[assignment]
    m.distinct_days, m.rationale_es, m.algorithm_version = (
        a.distinct_days,
        a.rationale_es,
        a.algorithm_version,
    )
    m.last_assessed_at, m.updated_at = now, now
    db.add(m)
    return m


def _apply_review_decision(
    db: Session,
    user_id: uuid.UUID,
    skill_id: uuid.UUID,
    attempt_id: uuid.UUID,
    context: str,
    result: str,
    hint_count: int,
    now: datetime,
) -> None:
    pending = _pending_review(db, user_id, skill_id, lock=True)
    prior: list[str] = []
    if pending is not None and context == "review" and pending.due_at <= now:
        prior = list(
            db.scalars(
                select(SkillEvidence.result)
                .where(
                    SkillEvidence.user_id == user_id,
                    SkillEvidence.skill_id == skill_id,
                    SkillEvidence.context == "review",
                    SkillEvidence.created_at >= pending.due_at,
                    SkillEvidence.attempt_id != attempt_id,
                    SkillEvidence.result != "needs_review",
                )
                .order_by(SkillEvidence.created_at)
            )
        )
    decision = scheduler.decide(
        pending=None
        if pending is None
        else scheduler.PendingReview(
            id=str(pending.id), due_at=pending.due_at, step=pending.step, interval_days=pending.interval_days
        ),
        context=context,
        result=result,
        hint_count=hint_count,
        now=now,
        prior_review_results=prior,
    )
    if pending is not None and decision.complete_pending:
        pending.status, pending.outcome, pending.completed_at = "completed", decision.complete_pending, now
    if pending is not None and decision.supersede_pending:
        pending.status, pending.completed_at = "superseded", now
    db.flush()
    if decision.create is not None:
        db.add(
            ReviewSchedule(
                user_id=user_id,
                skill_id=skill_id,
                due_at=decision.create.due_at,
                step=decision.create.step,
                interval_days=decision.create.interval_days,
                status="pending",
                reason=decision.create.reason,
                source_attempt_id=attempt_id,
                algorithm_version=scheduler.ALGORITHM_VERSION,
                created_at=now,
            )
        )


def _attempt_result(db: Session, attempt: Attempt, replay: bool, now: datetime) -> s.AttemptResultOut:
    item = db.get_one(ExerciseItem, attempt.exercise_id)
    skill = db.get_one(Skill, item.skill_id)
    ev = db.scalar(select(Evaluation).where(Evaluation.attempt_id == attempt.id))
    assert ev is not None
    pending = _pending_review(db, attempt.user_id, skill.id)
    mastery = db.get(SkillMastery, (attempt.user_id, skill.id))
    return s.AttemptResultOut(
        attempt_id=attempt.id,
        idempotent_replay=replay,
        evaluation=_evaluation_out(ev, item, attempt.original_answer, retry_used=attempt.retry_of is not None),
        mastery=_mastery_out(skill, mastery, pending, now),
        next_review=_review_out(pending, skill, now) if pending else None,
    )


def submit_attempt(db: Session, user_id: uuid.UUID, payload: s.AttemptIn, now: datetime) -> s.AttemptResultOut:
    existing = db.scalar(
        select(Attempt).where(Attempt.user_id == user_id, Attempt.client_submission_id == payload.client_submission_id)
    )
    if existing is not None:
        return _attempt_result(db, existing, replay=True, now=now)

    item = db.scalar(
        select(ExerciseItem).where(
            ExerciseItem.id == payload.exercise_id,
            ExerciseItem.published,
            ExerciseItem.pool.in_(["practice", "listening", "reading"]),
        )
    )
    if item is None:  # diagnóstico y Writing Lab tienen su propio camino
        raise ApiError(404, "INVALID_EXERCISE", "Ese ejercicio no existe o no está disponible.")
    if payload.retry_of is not None:
        original = db.get(Attempt, payload.retry_of)
        if original is None or original.user_id != user_id or original.exercise_id != item.id:
            raise ApiError(422, "INVALID_INPUT", "El reintento no corresponde a un intento tuyo de este ejercicio.")

    result, original_answer, _ = _grade(item, payload)
    context = "retry" if payload.retry_of else payload.mode

    attempt = Attempt(
        id=uuid.uuid4(),
        user_id=user_id,
        exercise_id=item.id,
        client_submission_id=payload.client_submission_id,
        mode=payload.mode,
        original_answer=original_answer,
        hint_count=payload.hint_count,
        retry_of=payload.retry_of,
        submitted_at=now,
    )
    try:
        with db.begin_nested():
            db.add(attempt)
            db.flush()
    except IntegrityError:  # doble envío concurrente con el mismo client_submission_id
        existing = db.scalar(
            select(Attempt).where(
                Attempt.user_id == user_id, Attempt.client_submission_id == payload.client_submission_id
            )
        )
        if existing is None:
            raise
        return _attempt_result(db, existing, replay=True, now=now)

    db.add(
        Evaluation(
            id=uuid.uuid4(),
            attempt_id=attempt.id,
            user_id=user_id,
            status=result.status,
            verdict=result.verdict,
            score=result.score,
            max_score=1,
            matched_rule=result.matched_rule,
            expected_answer=result.expected_answer,
            errors=[e.__dict__ for e in result.errors],
            feedback_es=result.feedback_es,
            grader=GRADER,
            grader_version=GRADER_VERSION,
            rubric_version=item.rubric_version,
            confidence=result.confidence,
            review_status="none",
            created_at=now,
        )
    )
    evidence_result = "needs_review" if result.verdict is None else VERDICT_TO_RESULT[result.verdict]
    db.add(
        SkillEvidence(
            user_id=user_id,
            skill_id=item.skill_id,
            attempt_id=attempt.id,
            exercise_id=item.id,
            context=context,
            hint_count=payload.hint_count,
            difficulty=item.difficulty,
            result=evidence_result,
            created_at=now,
        )
    )
    db.flush()
    _apply_review_decision(db, user_id, item.skill_id, attempt.id, context, evidence_result, payload.hint_count, now)
    _update_mastery(db, user_id, item.skill_id, now)
    db.flush()
    return _attempt_result(db, attempt, replay=False, now=now)


def dispute_evaluation(
    db: Session, user_id: uuid.UUID, evaluation_id: uuid.UUID, reason: str, now: datetime
) -> s.DisputeOut:
    ev = db.get(Evaluation, evaluation_id)
    if ev is None or ev.user_id != user_id:  # no revelamos si existe para otro usuario
        raise ApiError(404, "NOT_FOUND", "No encontramos esa corrección.")
    existing = db.scalar(select(EvaluationDispute).where(EvaluationDispute.evaluation_id == ev.id))
    if existing is not None:
        return s.DisputeOut(id=existing.id, status=existing.status)
    dispute = EvaluationDispute(
        id=uuid.uuid4(),
        evaluation_id=ev.id,
        user_id=user_id,
        reason=reason.strip(),
        status="open",
        created_at=now,
    )
    ev.review_status = "disputed"
    db.add(dispute)
    db.flush()
    return s.DisputeOut(id=dispute.id, status="open")


# ───────────────────────────── repaso, progreso, misión ─────────────────────────────


def _due_reviews(db: Session, user_id: uuid.UUID, now: datetime) -> list[tuple[ReviewSchedule, Skill]]:
    rows = db.execute(
        select(ReviewSchedule, Skill)
        .join(Skill, Skill.id == ReviewSchedule.skill_id)
        .where(ReviewSchedule.user_id == user_id, ReviewSchedule.status == "pending")
        .order_by(ReviewSchedule.due_at)
    ).all()
    return [(r, sk) for r, sk in rows]


def _pick_review_items(db: Session, user_id: uuid.UUID, skill: Skill, now: datetime) -> list[ExerciseItem]:
    """Ítems distintos para «revancha»: primero los nunca vistos, luego los menos recientes (US05)."""
    items = db.scalars(
        select(ExerciseItem).where(
            ExerciseItem.skill_id == skill.id, ExerciseItem.published, ExerciseItem.pool == "practice"
        )
    ).all()
    last_seen = dict(
        db.execute(
            select(Attempt.exercise_id, func.max(Attempt.submitted_at))
            .where(Attempt.user_id == user_id)
            .group_by(Attempt.exercise_id)
        ).all()
    )
    day_seed = f"{user_id}:{now.date().isoformat()}"

    def key(item: ExerciseItem) -> tuple[int, datetime, str]:
        seen = last_seen.get(item.id)
        shuffle = hashlib.sha256(f"{day_seed}:{item.id}".encode()).hexdigest()
        return (0 if seen is None else 1, seen or datetime.min.replace(tzinfo=now.tzinfo), shuffle)

    recent_cutoff = now - timedelta(hours=12)
    fresh = [i for i in items if (last_seen.get(i.id) or recent_cutoff) <= recent_cutoff]
    pool = sorted(fresh, key=key) or sorted(items, key=key)
    return pool[:REVIEW_ITEMS_PER_SKILL]


def review_session(db: Session, user_id: uuid.UUID, now: datetime) -> s.ReviewSessionOut:
    pending = _due_reviews(db, user_id, now)
    due = [(r, sk) for r, sk in pending if r.due_at <= now]
    exercises: list[s.ExerciseOut] = []
    for _, skill in due:
        exercises += [_exercise_out(i, skill.code, "review") for i in _pick_review_items(db, user_id, skill, now)]
    upcoming = [r.due_at for r, _ in pending if r.due_at > now]
    return s.ReviewSessionOut(
        due=[_review_out(r, sk, now) for r, sk in due],
        exercises=exercises,
        next_due_at=min(upcoming) if upcoming else None,
    )


def practice_days(db: Session, user_id: uuid.UUID, now: datetime, window_days: int = 60) -> list[date]:
    """Días (en la zona horaria de la persona) con práctica real: intentos o mensajes a Lania."""
    profile = db.get(Profile, user_id)
    tz = ZoneInfo(profile.timezone if profile else "UTC")
    since = now - timedelta(days=window_days)
    stamps = list(
        db.scalars(select(Attempt.submitted_at).where(Attempt.user_id == user_id, Attempt.submitted_at >= since))
    )
    stamps += list(
        db.scalars(
            select(TutorMessage.created_at).where(
                TutorMessage.user_id == user_id, TutorMessage.role == "user", TutorMessage.created_at >= since
            )
        )
    )
    stamps += list(
        db.scalars(
            select(SpeakingTurn.created_at).where(SpeakingTurn.user_id == user_id, SpeakingTurn.created_at >= since)
        )
    )
    return sorted({t.astimezone(tz).date() for t in stamps})


def streak_from(days: list[date], today: date) -> int:
    """Días seguidos practicando que terminan hoy o ayer (si hoy aún no practicaste, no se pierde)."""
    have = set(days)
    cursor = today if today in have else today - timedelta(days=1)
    streak = 0
    while cursor in have:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def progress(db: Session, user_id: uuid.UUID, now: datetime) -> s.ProgressOut:
    content_skills = set(db.scalars(select(Lesson.skill_id).where(Lesson.published)))
    mastery = {m.skill_id: m for m in db.scalars(select(SkillMastery).where(SkillMastery.user_id == user_id))}
    pending = {r.skill_id: r for r, _ in _due_reviews(db, user_id, now)}
    skills = db.scalars(select(Skill).where(Skill.id.in_(content_skills | set(mastery))).order_by(Skill.code)).all()

    mistakes = db.execute(
        select(Evaluation, Attempt, ExerciseItem)
        .join(Attempt, Attempt.id == Evaluation.attempt_id)
        .join(ExerciseItem, ExerciseItem.id == Attempt.exercise_id)
        .where(Evaluation.user_id == user_id, Evaluation.verdict.in_(["incorrect", "partial", "spelling_error"]))
        .order_by(Attempt.submitted_at.desc())
        .limit(5)
    ).all()
    recent: list[s.RecentMistakeOut] = []
    for ev, att, item in mistakes:
        out = _evaluation_out(ev, item, att.original_answer, retry_used=True)
        recent.append(
            s.RecentMistakeOut(
                attempt_id=att.id,
                submitted_at=att.submitted_at,
                prompt_en=item.prompt.get("sentence_en")
                or item.prompt.get("question_en")
                or item.prompt.get("task_en", ""),
                your_answer=out.your_answer,
                verdict=ev.verdict,
                correction=out.correct_sentence or out.expected_answer,
                feedback_es=ev.feedback_es,
            )
        )
    total = db.scalar(select(func.count()).select_from(Attempt).where(Attempt.user_id == user_id)) or 0
    skill_by_id = {sk.id: sk for sk in skills}
    days = practice_days(db, user_id, now)
    owner = db.get(Profile, user_id)
    tz_name = owner.timezone if owner else "UTC"
    return s.ProgressOut(
        skills=[_mastery_out(sk, mastery.get(sk.id), pending.get(sk.id), now) for sk in skills],
        reviews=[_review_out(r, skill_by_id[r.skill_id], now) for r in pending.values() if r.skill_id in skill_by_id],
        recent_mistakes=recent,
        total_attempts=total,
        practice_days=days,
        streak_days=streak_from(days, now.astimezone(ZoneInfo(tz_name)).date()),
        server_now=now,
    )


def next_mission(db: Session, user_id: uuid.UUID, now: datetime) -> s.NextMissionOut:
    """Selección explicable por reglas (spec §8.2: el motor decide, no el LLM)."""
    pending = _due_reviews(db, user_id, now)
    due = [(r, sk) for r, sk in pending if r.due_at <= now]
    if due:
        r, sk = due[0]
        why = {
            "error": "porque fallaste un ejercicio",
            "retention": "para comprobar que lo recuerdas",
            "review_passed": "para fijarlo a más largo plazo",
            "review_failed": "porque el último repaso costó",
        }
        return s.NextMissionOut(
            kind="review",
            title_es=f"Repaso: {sk.name_es}",
            skill_code=sk.code,
            href="/review",
            due_at=r.due_at,
            reason_es=f"Tienes un repaso vencido ({why[r.reason]}). Usaremos ejercicios distintos a los que ya viste.",
        )

    active = db.scalar(
        select(DiagnosticRun.id).where(DiagnosticRun.user_id == user_id, DiagnosticRun.status == "in_progress")
    )
    if active is not None:
        return s.NextMissionOut(
            kind="diagnostic",
            title_es="Continúa tu diagnóstico",
            skill_code=None,
            href="/diagnostic",
            reason_es="Lo dejaste a medias; seguimos exactamente donde quedaste.",
        )
    last_report = db.scalar(
        select(DiagnosticRun.report)
        .where(DiagnosticRun.user_id == user_id, DiagnosticRun.status == "completed")
        .order_by(DiagnosticRun.completed_at.desc())
        .limit(1)
    )
    has_evidence = db.scalar(select(SkillEvidence.id).where(SkillEvidence.user_id == user_id).limit(1))
    if last_report is None and has_evidence is None:
        return s.NextMissionOut(
            kind="diagnostic",
            title_es="Diagnóstico inicial (20–30 min)",
            skill_code=None,
            href="/diagnostic",
            reason_es="Antes de enseñarte, medimos por separado gramática, vocabulario, lectura y escritura. "
            "Así no pierdes tiempo en lo que ya sabes. Puedes pausarlo cuando quieras.",
        )

    # Orden de lecciones: prioridades del último diagnóstico y luego el orden base del piloto.
    slugs = [m["href"].removeprefix("/learn/") for m in (last_report or {}).get("missions", []) if m.get("href")]
    whys = {
        m["href"].removeprefix("/learn/"): m["why_es"] for m in (last_report or {}).get("missions", []) if m.get("href")
    }
    published = list(db.scalars(select(Lesson.slug).where(Lesson.published).order_by(Lesson.slug)))
    ordered = [sl for sl in [*slugs, *LESSON_ORDER, *published] if sl in published]
    ordered = list(dict.fromkeys(ordered))
    pending_review = min((r.due_at for r, _ in pending), default=None)
    for slug in ordered:
        lesson = get_lesson(db, slug)
        lesson_ids = [e.id for e in lesson.exercises]
        attempted = set(
            db.scalars(
                select(Attempt.exercise_id).where(Attempt.user_id == user_id, Attempt.exercise_id.in_(lesson_ids))
            )
        )
        if len(attempted) >= len(lesson_ids):
            continue
        source = "Según tu diagnóstico: " + whys[slug] if slug in whys else LESSON_WHY.get(slug, "")
        if attempted:
            return s.NextMissionOut(
                kind="lesson",
                title_es=f"Continúa: {lesson.title_es}",
                skill_code=lesson.skill_code,
                href=f"/learn/{lesson.slug}",
                reason_es=f"Te quedan {len(lesson_ids) - len(attempted)} ejercicio(s) de esta microclase.",
            )
        return s.NextMissionOut(
            kind="lesson",
            title_es=lesson.title_es,
            skill_code=lesson.skill_code,
            href=f"/learn/{lesson.slug}",
            reason_es=source.strip() or lesson.content.goal_es,
        )
    first = ordered[0] if ordered else DEFAULT_LESSON
    return s.NextMissionOut(
        kind="none",
        title_es="Estás al día",
        skill_code=None,
        href=f"/learn/{first}",
        due_at=pending_review,
        reason_es="Completaste las microclases disponibles. Tus repasos ya están programados; mientras tanto "
        "puedes repetir una práctica o conversar con Lania.",
    )
