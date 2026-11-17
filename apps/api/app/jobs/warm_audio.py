"""Genera por adelantado el audio de listening, de las lecturas (párrafos y glosario) y de Speaking.

Idempotente (lo ya generado sale de `tts_cache`). Uso tras un despliegue: `uv run python -m app.jobs.warm_audio`.
"""

from app.ai import voice
from app.content.loader import load_content
from app.core.config import get_settings
from app.db.session import _session_factory
from app.domain.listening.service import segment_audio
from app.domain.reading.service import audio as reading_audio


def main() -> None:
    settings = get_settings()
    if not voice.tts_available(settings):
        print("warm_audio: TTS no configurado; nada que hacer")
        return
    bundle = load_content()
    done = 0
    for ep in bundle.episodes:
        for i in range(len(ep.segments)):
            with _session_factory()() as db, db.begin():
                segment_audio(db, settings, ep.slug, i)
            done += 1
    for rd in bundle.readings:
        for what in [*(f"p:{i}" for i in range(len(rd.paragraphs))), *(f"w:{i}" for i in range(len(rd.glossary)))]:
            with _session_factory()() as db, db.begin():
                reading_audio(db, settings, rd.slug, what)
            done += 1
    for sc in bundle.scenarios:
        for text in [*(st.lania_en for st in sc.steps), sc.closing_en]:
            with _session_factory()() as db, db.begin():
                voice.synthesize(
                    db, settings, text=text, instructions=settings.tts_instructions_lania, kind="listening"
                )
            done += 1
    print(f"warm_audio: {done} audios listos")


if __name__ == "__main__":
    main()
