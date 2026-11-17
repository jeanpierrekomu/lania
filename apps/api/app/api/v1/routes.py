"""Endpoints v1 del vertical slice (spec §7)."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Query, Response, UploadFile

from app.ai.gateway import ai_available
from app.api.v1 import schemas as s
from app.core.clock import clock, get_now
from app.core.config import Settings, get_settings
from app.core.errors import ApiError, ErrorBody
from app.core.security import UserDep, issue_local_token
from app.db.models import PilotFeedback
from app.db.session import DbDep, _session_factory
from app.domain.admin import service as admin
from app.domain.diagnostics import service as diagnostics
from app.domain.learning import service
from app.domain.listening import service as listening
from app.domain.missions import service as missions
from app.domain.onboarding import service as onboarding
from app.domain.privacy import service as privacy
from app.domain.reading import service as reading
from app.domain.rooms import service as rooms
from app.domain.speaking import service as speaking
from app.domain.tutor import service as tutor
from app.domain.writing import lab as writing_lab

NowDep = Annotated[datetime, Depends(get_now)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
ERRORS = {401: {"model": ErrorBody}, 404: {"model": ErrorBody}, 422: {"model": ErrorBody}}

router = APIRouter(prefix="/api/v1", responses=ERRORS)  # type: ignore[arg-type]


@router.get("/health", tags=["system"])
def health(settings: SettingsDep) -> s.HealthOut:
    return s.HealthOut(
        status="ok", app_env=settings.app_env, auth_mode=settings.auth_mode, ai_available=ai_available(settings)
    )


@router.get("/me", tags=["me"])
def me(user: UserDep, db: DbDep) -> s.MeOut:
    return service.get_me(db, user.id)


@router.get("/lessons/{slug}", tags=["learning"])
def lesson(slug: str, user: UserDep, db: DbDep) -> s.LessonOut:
    return service.get_lesson(db, slug)


@router.get("/learning/next", tags=["learning"])
def learning_next(user: UserDep, db: DbDep, now: NowDep) -> s.NextMissionOut:
    return service.next_mission(db, user.id, now)


@router.post("/attempts", tags=["learning"])
def create_attempt(payload: s.AttemptIn, user: UserDep, db: DbDep, now: NowDep) -> s.AttemptResultOut:
    return service.submit_attempt(db, user.id, payload, now)


@router.post("/evaluations/{evaluation_id}/dispute", tags=["learning"])
def dispute(evaluation_id: uuid.UUID, payload: s.DisputeIn, user: UserDep, db: DbDep, now: NowDep) -> s.DisputeOut:
    return service.dispute_evaluation(db, user.id, evaluation_id, payload.reason, now)


@router.get("/reviews/session", tags=["learning"])
def review_session(user: UserDep, db: DbDep, now: NowDep) -> s.ReviewSessionOut:
    return service.review_session(db, user.id, now)


@router.get("/progress", tags=["learning"])
def progress(user: UserDep, db: DbDep, now: NowDep) -> s.ProgressOut:
    return service.progress(db, user.id, now)


@router.put("/me/preferences", tags=["me"])
def put_preferences(payload: s.PreferencesIn, user: UserDep, db: DbDep) -> s.MeOut:
    return service.update_preferences(db, user.id, payload)


@router.put("/me/onboarding", tags=["me"])
def put_onboarding(payload: s.OnboardingIn, user: UserDep, db: DbDep, now: NowDep) -> s.MeOut:
    onboarding.save_onboarding(db, user.id, payload, now)
    return service.get_me(db, user.id)


# ── Privacidad (docs/security/privacy.md) ──
@router.post("/me/pilot-consent", tags=["me"])
def pilot_consent(user: UserDep, db: DbDep, now: NowDep) -> s.MeOut:
    privacy.record_pilot_consent(db, user.id, now)
    return service.get_me(db, user.id)


@router.get("/privacy/export", tags=["privacy"])
def privacy_export(user: UserDep, db: DbDep, now: NowDep) -> s.PrivacyExportOut:
    return s.PrivacyExportOut.model_validate(privacy.export_data(db, user.id, now))


@router.delete("/privacy/account", tags=["privacy"], status_code=204)
def privacy_delete_account(user: UserDep, db: DbDep, now: NowDep) -> None:
    privacy.delete_account(db, user.id, now)


# ── Diagnóstico ──
@router.post("/diagnostics", tags=["diagnostic"])
def start_diagnostic(user: UserDep, db: DbDep, now: NowDep) -> s.DiagnosticStateOut:
    return diagnostics.start_or_resume(db, user.id, now)


@router.get("/diagnostics/current", tags=["diagnostic"])
def current_diagnostic(user: UserDep, db: DbDep, now: NowDep) -> s.DiagnosticCurrentOut:
    return diagnostics.current(db, user.id, now)


def _evaluate_writing_in_background(attempt_id: uuid.UUID) -> None:
    settings = get_settings()
    with _session_factory()() as db, db.begin():
        diagnostics.evaluate_writing_attempt(db, settings, attempt_id, clock.now())


@router.post("/diagnostics/{run_id}/answers", tags=["diagnostic"])
def answer_diagnostic(
    run_id: uuid.UUID,
    payload: s.DiagnosticAnswerIn,
    background: BackgroundTasks,
    user: UserDep,
    db: DbDep,
    settings: SettingsDep,
    now: NowDep,
) -> s.DiagnosticStateOut:
    state, writing_attempt = diagnostics.answer(db, settings, user.id, run_id, payload, now)
    if writing_attempt is not None:
        db.commit()  # la evaluación en segundo plano necesita ver el intento ya guardado
        background.add_task(_evaluate_writing_in_background, writing_attempt)
    return state


@router.get("/diagnostics/{run_id}/report", tags=["diagnostic"])
def diagnostic_report(run_id: uuid.UUID, user: UserDep, db: DbDep) -> s.DiagnosticReportOut:
    return diagnostics.get_report(db, user.id, run_id)


# ── Writing Lab ──
@router.get("/writing/prompts", tags=["writing"])
def writing_prompts(user: UserDep, db: DbDep) -> list[s.WritingPromptOut]:
    me = service.get_me(db, user.id)
    return writing_lab.list_prompts(db, [*me.onboarding.interests, me.onboarding.goal] if me.onboarding else None)


@router.get("/writing/submissions", tags=["writing"])
def writing_history(user: UserDep, db: DbDep) -> list[s.WritingSubmissionOut]:
    return writing_lab.history(db, user.id)


@router.post("/writing/submissions", tags=["writing"])
def writing_submit(
    payload: s.WritingSubmissionIn, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep
) -> s.WritingSubmissionOut:
    return writing_lab.submit(db, settings, user.id, payload, now)


# ── Listening Lab (las respuestas a preguntas van por POST /attempts) ──
AUDIO_CACHE = {"Cache-Control": "private, max-age=86400"}


@router.get("/listening/episodes", tags=["listening"])
def listening_episodes(user: UserDep, db: DbDep, settings: SettingsDep) -> list[s.EpisodeSummaryOut]:
    return listening.list_episodes(db, settings, user.id)


@router.get("/listening/episodes/{slug}", tags=["listening"])
def listening_episode(slug: str, user: UserDep, db: DbDep, settings: SettingsDep) -> s.EpisodeOut:
    return listening.get_episode(db, settings, user.id, slug)


@router.get(
    "/listening/episodes/{slug}/segments/{index}/audio",
    tags=["listening"],
    response_class=Response,
    responses={200: {"content": {"audio/mpeg": {}}}},
)
def listening_audio(slug: str, index: int, user: UserDep, db: DbDep, settings: SettingsDep) -> Response:
    audio = listening.segment_audio(db, settings, slug, index)
    return Response(content=audio.data, media_type=audio.mime, headers=AUDIO_CACHE)


# ── Reading Lab (las respuestas a preguntas van por POST /attempts) ──
@router.get("/reading/texts", tags=["reading"])
def reading_texts(user: UserDep, db: DbDep) -> list[s.ReadingSummaryOut]:
    return reading.list_readings(db, user.id)


@router.get("/reading/texts/{slug}", tags=["reading"])
def reading_text(slug: str, user: UserDep, db: DbDep, settings: SettingsDep) -> s.ReadingOut:
    return reading.get_reading(db, settings, user.id, slug)


@router.get(
    "/reading/texts/{slug}/audio",
    tags=["reading"],
    response_class=Response,
    responses={200: {"content": {"audio/mpeg": {}}}},
)
def reading_audio(
    slug: str,
    user: UserDep,
    db: DbDep,
    settings: SettingsDep,
    what: Annotated[str, Query(pattern=r"^(p|w):\d{1,2}$")],
) -> Response:
    out = reading.audio(db, settings, slug, what)
    return Response(content=out.data, media_type=out.mime, headers=AUDIO_CACHE)


# ── Speaking Lab ──
@router.get("/speaking/scenarios", tags=["speaking"])
def speaking_scenarios(user: UserDep) -> list[s.ScenarioSummaryOut]:
    return speaking.list_scenarios()


@router.post("/speaking/sessions", tags=["speaking"])
def speaking_start(
    payload: s.SpeakingStartIn, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep
) -> s.SpeakingSessionOut:
    return speaking.start(db, settings, user.id, payload.scenario, now)


@router.get("/speaking/sessions/{session_id}", tags=["speaking"])
def speaking_get(session_id: uuid.UUID, user: UserDep, db: DbDep, settings: SettingsDep) -> s.SpeakingSessionOut:
    return speaking.get(db, settings, user.id, session_id)


@router.post("/speaking/sessions/{session_id}/turns", tags=["speaking"])
async def speaking_turn(
    session_id: uuid.UUID,
    user: UserDep,
    db: DbDep,
    settings: SettingsDep,
    now: NowDep,
    client_turn_id: Annotated[uuid.UUID, Form()],
    text: Annotated[str | None, Form(max_length=2000)] = None,
    seconds: Annotated[float | None, Form(ge=0, le=600)] = None,
    audio: Annotated[UploadFile | None, File()] = None,
) -> s.SpeakingSessionOut:
    data = None
    if audio is not None:
        data = await audio.read(settings.max_audio_upload_bytes + 1)
    return speaking.take_turn(
        db,
        settings,
        user.id,
        session_id,
        client_turn_id=client_turn_id,
        text=text,
        audio=data,
        seconds=seconds,
        now=now,
    )


@router.get(
    "/speaking/sessions/{session_id}/audio",
    tags=["speaking"],
    response_class=Response,
    responses={200: {"content": {"audio/mpeg": {}}}},
)
def speaking_audio(
    session_id: uuid.UUID,
    user: UserDep,
    db: DbDep,
    settings: SettingsDep,
    what: Annotated[str, Query(pattern=r"^(prompt:\d{1,2}|turn:[0-9a-f-]{36})$")],
) -> Response:
    audio = speaking.lania_audio(db, settings, user.id, session_id, what)
    return Response(content=audio.data, media_type=audio.mime, headers=AUDIO_CACHE)


# ── Misiones ──
@router.get("/missions", tags=["missions"])
def missions_list(user: UserDep, db: DbDep) -> list[s.MissionProgressOut]:
    me = service.get_me(db, user.id)
    interests = [*me.onboarding.interests, me.onboarding.goal] if me.onboarding else []
    return missions.list_missions(db, user.id, interests)


# ── Salones (base preparada; responden 404 mientras ROOMS_ENABLED=false) ──
@router.get("/rooms", tags=["rooms"])
def rooms_list(user: UserDep, db: DbDep, settings: SettingsDep) -> list[s.RoomOut]:
    rooms.require_enabled(settings)
    return rooms.list_rooms(db, user.id)


@router.post("/rooms/{room_id}/join", tags=["rooms"])
def rooms_join(room_id: uuid.UUID, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep) -> s.RoomOut:
    rooms.require_enabled(settings)
    return rooms.join(db, user.id, room_id, now)


@router.post("/rooms/{room_id}/leave", tags=["rooms"], status_code=204)
def rooms_leave(room_id: uuid.UUID, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep) -> None:
    rooms.require_enabled(settings)
    rooms.leave(db, user.id, room_id, now)


@router.get("/rooms/{room_id}/messages", tags=["rooms"])
def rooms_messages(
    room_id: uuid.UUID, user: UserDep, db: DbDep, settings: SettingsDep, after: datetime | None = None
) -> list[s.RoomMessageOut]:
    rooms.require_enabled(settings)
    return rooms.messages(db, user.id, room_id, after)


@router.post("/rooms/{room_id}/messages", tags=["rooms"])
def rooms_post(
    room_id: uuid.UUID, payload: s.RoomMessageIn, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep
) -> s.RoomMessageOut:
    rooms.require_enabled(settings)
    return rooms.post(db, user.id, room_id, payload.text, now)


@router.post("/rooms/{room_id}/messages/{message_id}/report", tags=["rooms"], status_code=204)
def rooms_report(
    room_id: uuid.UUID, message_id: uuid.UUID, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep
) -> None:
    rooms.require_enabled(settings)
    rooms.report(db, user.id, room_id, message_id, now)


# ── Tutor ──
@router.post("/tutor/conversations", tags=["tutor"])
def new_conversation(
    payload: s.TutorConversationIn, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep
) -> s.TutorConversationOut:
    return tutor.create_conversation(db, settings, user.id, payload, now)


@router.get("/tutor/conversations/latest", tags=["tutor"])
def latest_conversation(user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep) -> s.TutorConversationOut | None:
    return tutor.latest_conversation(db, settings, user.id, now)


@router.get("/tutor/conversations/{conversation_id}", tags=["tutor"])
def get_conversation(
    conversation_id: uuid.UUID, user: UserDep, db: DbDep, settings: SettingsDep, now: NowDep
) -> s.TutorConversationOut:
    return tutor.get_conversation(db, settings, user.id, conversation_id, now)


@router.post("/tutor/conversations/{conversation_id}/messages", tags=["tutor"])
def send_tutor_message(
    conversation_id: uuid.UUID,
    payload: s.TutorMessageIn,
    user: UserDep,
    db: DbDep,
    settings: SettingsDep,
    now: NowDep,
) -> s.TutorTurnOut:
    return tutor.send_message(db, settings, user.id, conversation_id, payload, now)


# ── Comentarios del piloto ──
@router.post("/feedback", tags=["me"], status_code=204)
def send_feedback(payload: s.FeedbackIn, user: UserDep, db: DbDep, now: NowDep) -> None:
    db.add(
        PilotFeedback(
            user_id=user.id,
            kind=payload.kind,
            message=payload.message.strip(),
            page=payload.page,
            status="new",
            created_at=now,
        )
    )


@router.get("/admin/feedback", tags=["admin"])
def admin_feedback(user: UserDep, db: DbDep) -> list[s.FeedbackOut]:
    admin.require_staff(db, user.id)
    return admin.list_feedback(db)


# ── Staff: revisión de contenido y operación ──
@router.get("/admin/disputes", tags=["admin"])
def admin_disputes(
    user: UserDep, db: DbDep, status: Annotated[str, Query(pattern="^(open|accepted|rejected)$")] = "open"
) -> list[s.DisputeReviewOut]:
    admin.require_staff(db, user.id)
    return admin.list_disputes(db, status)


@router.post("/admin/disputes/{dispute_id}/resolve", tags=["admin"])
def admin_resolve(
    dispute_id: uuid.UUID, payload: s.DisputeResolveIn, user: UserDep, db: DbDep, now: NowDep
) -> s.DisputeReviewOut:
    admin.require_staff(db, user.id)
    return admin.resolve_dispute(db, user.id, dispute_id, payload, now)


@router.get("/admin/ai-usage", tags=["admin"])
def admin_ai_usage(user: UserDep, db: DbDep, now: NowDep) -> s.AiUsageOut:
    admin.require_staff(db, user.id)
    return admin.ai_usage(db, now)


# ── Solo desarrollo local: no se registran si APP_ENV no es local/test ──
dev_router = APIRouter(prefix="/api/v1/dev", tags=["dev-only"])


@dev_router.post("/session")
def dev_session(payload: s.DevSessionIn, db: DbDep, settings: SettingsDep) -> s.SessionOut:
    if settings.auth_mode != "local":
        raise ApiError(404, "NOT_FOUND", "No disponible.")
    user_id = service.get_or_create_local_user(db, payload.email, payload.display_name)
    db.flush()
    # Hora REAL: el reloj simulado solo afecta la lógica de repasos, nunca la validez del token.
    token, ttl = issue_local_token(settings, user_id, datetime.now(UTC))
    return s.SessionOut(access_token=token, expires_in=ttl, user=service.get_me(db, user_id))


@dev_router.get("/clock")
def get_clock(now: NowDep) -> s.ClockOut:
    return s.ClockOut(now=now, offset_days=clock.offset / timedelta(days=1))


@dev_router.post("/clock")
def set_clock(payload: s.ClockIn) -> s.ClockOut:
    """Adelanta el reloj del servidor para probar repasos diferidos sin esperar días."""
    clock.offset = timedelta(0) if payload.reset else clock.offset + timedelta(days=payload.advance_days)
    return s.ClockOut(now=clock.now(), offset_days=clock.offset / timedelta(days=1))
