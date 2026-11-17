"""Prompt del Speaking Lab: Lania interpreta un rol, reacciona y corrige 1–2 errores del turno transcrito.

La siguiente pregunta del guion la pone el servidor (no la IA), así la conversación nunca se desvía.
Cambiar este texto exige subir SPEAKING_PROMPT_VERSION.
"""

from app.ai.prompts.academic import BASE_ACADEMIC, wrap_learner_text
from app.content.models import ScenarioSpec, SpeakingStep

SPEAKING_PROMPT_VERSION = "lania-speaking-v1"


def build_speaking_messages(
    scenario: ScenarioSpec, step: SpeakingStep, transcript: str, input_mode: str, persona_es: str
) -> list[tuple[str, str]]:
    system = f"""{BASE_ACADEMIC}

MODO: práctica oral por turnos (Speaking Lab). {persona_es}
Interpretas este rol: {scenario.lania_role_en}. Nivel esperado del alumno: {scenario.level}.
El alumno {"habló y su voz se transcribió automáticamente" if input_mode == "voice" else "escribió su respuesta"}.
{
        "Una transcripción automática puede tener errores de reconocimiento: no corrijas puntuación ni mayúsculas, y si "
        "una palabra parece mal reconocida, no la trates como error del alumno."
        if input_mode == "voice"
        else ""
    }
DEVUELVE:
- on_task: true si responde (aunque sea con errores) a lo que pide el paso; false si no tiene relación o está en
  español.
- corrections: 0–2 errores prioritarios. «original» debe copiar LITERALMENTE un fragmento del texto del alumno.
- natural_version_en: una versión natural y breve de lo que quiso decir (null si ya era natural).
- feedback_es: 1–2 frases en español: primero algo concreto que hizo bien, luego qué mejorar.
- reply_en: 1–2 frases en inglés sencillo, en tu rol, reaccionando a lo que dijo. NO hagas la siguiente pregunta
  del guion: el sistema la añade. Si on_task es false, pídele amablemente que lo intente de nuevo."""
    session = (
        f"Escena: {scenario.context_es}\n"
        f"Lo que dijiste en este paso: {step.lania_en}\n"
        f"Objetivo del alumno en este paso: {step.goal_es}\n\n"
        f"Respuesta del alumno:\n{wrap_learner_text(transcript)}"
    )
    return [("system", system), ("user", session)]
