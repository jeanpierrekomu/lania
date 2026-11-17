"""Reading Lab: lecturas originales por nivel y tema, glosario con audio y preguntas corregidas en el servidor
con el motor de ejercicios cerrados (cuentan como evidencia de lectura). Las claves nunca llegan al navegador."""

import uuid
from functools import lru_cache

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai import voice
from app.ai.providers.speech import SpeechAudio
from app.api.v1 import schemas as s
from app.content.loader import load_content
from app.content.models import ReadingSpec
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import ExerciseItem
from app.domain.listening.service import _solved

READ_ALOUD = "Clear, natural American English read aloud at a calm, steady pace for language learners."


@lru_cache
def readings() -> dict[str, ReadingSpec]:
    return {r.slug: r for r in load_content().readings}


def _reading(slug: str) -> ReadingSpec:
    rd = readings().get(slug)
    if rd is None:
        raise ApiError(404, "NOT_FOUND", "Esa lectura no existe.")
    return rd


def _items(db: Session, rd: ReadingSpec) -> dict[str, ExerciseItem]:
    rows = db.scalars(
        select(ExerciseItem).where(ExerciseItem.external_id.in_(list(rd.questions)), ExerciseItem.published)
    ).all()
    return {r.external_id: r for r in rows}


def words(rd: ReadingSpec) -> int:
    return sum(len(p.split()) for p in rd.paragraphs)


def list_readings(db: Session, user_id: uuid.UUID) -> list[s.ReadingSummaryOut]:
    out = []
    for rd in sorted(readings().values(), key=lambda r: (r.level, r.slug)):  # de A1 a B1
        items = _items(db, rd)
        solved = _solved(db, user_id, [i.id for i in items.values()])
        out.append(
            s.ReadingSummaryOut(
                slug=rd.slug,
                title_en=rd.title_en,
                title_es=rd.title_es,
                kind_es=rd.kind_es,
                level=rd.level,
                topic=rd.topic,
                words=words(rd),
                minutes=max(1, round(words(rd) / 90)),
                questions=len(rd.questions),
                solved=len(solved),
            )
        )
    return out


def get_reading(db: Session, settings: Settings, user_id: uuid.UUID, slug: str) -> s.ReadingOut:
    rd = _reading(slug)
    items = _items(db, rd)
    solved = _solved(db, user_id, [i.id for i in items.values()])
    questions = []
    for ext_id, paragraph in rd.questions.items():
        item = items.get(ext_id)
        if item is None:
            continue
        p = item.prompt
        questions.append(
            s.ReadingQuestionOut(
                exercise_id=item.id,
                question_en=p["question_en"],
                instruction_es=p["instruction_es"],
                options=[s.ChoiceOptionOut(id=o["id"], text=o["text"]) for o in p["options"]],
                paragraph=paragraph,
                solved=item.id in solved,
            )
        )
    return s.ReadingOut(
        slug=rd.slug,
        title_en=rd.title_en,
        title_es=rd.title_es,
        kind_es=rd.kind_es,
        level=rd.level,
        topic=rd.topic,
        words=words(rd),
        paragraphs=rd.paragraphs,
        glossary=[s.GlossaryOut(en=g.en, es=g.es) for g in rd.glossary],
        questions=questions,
        server_audio=voice.tts_available(settings),
    )


def audio(db: Session, settings: Settings, slug: str, what: str) -> SpeechAudio:
    """Lectura en voz alta: «p:<n>» un párrafo, «w:<n>» una palabra del glosario (siempre texto del catálogo)."""
    rd = _reading(slug)
    kind, _, ref = what.partition(":")
    if not ref.isdigit():
        raise ApiError(404, "NOT_FOUND", "Ese audio no existe.")
    i = int(ref)
    if kind == "p" and i < len(rd.paragraphs):
        text = rd.paragraphs[i]
    elif kind == "w" and i < len(rd.glossary):
        text = rd.glossary[i].en
    else:
        raise ApiError(404, "NOT_FOUND", "Ese audio no existe.")
    return voice.synthesize(db, settings, text=text, instructions=READ_ALOUD, kind="listening")
