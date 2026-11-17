"""Bienvenida (onboarding): meta, intereses, ritmo y estilo de Lania, más el consentimiento del piloto."""

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.api.v1 import schemas as s
from app.core.errors import ApiError
from app.db.models import LearnerGoals, LearningPreferences, Profile
from app.domain.privacy.service import record_pilot_consent

# Estilos del diseño LANIA ↔ personas de la tutora (tutor_persona).
PERSONA_BY_STYLE: dict[str, str] = {"divertida": "fun", "tranquila": "calm", "exigente": "coach"}
# Minutos por sesión elegidos en la bienvenida ↔ duración de microclase guardada en preferencias.
LESSON_MINUTES: dict[int, int] = {5: 5, 15: 10, 30: 20}


def save_onboarding(db: Session, user_id: uuid.UUID, payload: s.OnboardingIn, now: datetime) -> None:
    profile = db.get(Profile, user_id)
    prefs = db.get(LearningPreferences, user_id)
    if profile is None or prefs is None:
        raise ApiError(404, "NOT_FOUND", "No encontramos tu perfil.")
    profile.display_name = payload.display_name
    prefs.tutor_persona = PERSONA_BY_STYLE[payload.teacher_style]
    prefs.lesson_duration_min = LESSON_MINUTES[payload.session_minutes]
    interests = list(dict.fromkeys(payload.interests))
    goals = db.get(LearnerGoals, user_id)
    if goals is None:
        db.add(
            LearnerGoals(
                user_id=user_id,
                goal=payload.goal,
                self_level=payload.self_level,
                interests=interests,
                session_minutes=payload.session_minutes,
                onboarded_at=now,
            )
        )
    else:
        goals.goal, goals.self_level = payload.goal, payload.self_level
        goals.interests, goals.session_minutes = interests, payload.session_minutes
    record_pilot_consent(db, user_id, now)
