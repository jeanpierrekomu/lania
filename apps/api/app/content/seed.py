"""Seed idempotente del contenido YAML a la base (local, staging o prod con DATABASE_URL).

Uso: `uv run python -m app.content.seed`
"""

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.content.loader import ContentBundle, load_content
from app.db.models import ExerciseItem, Lesson, LessonItem, Skill


def seed_content(session: Session, bundle: ContentBundle | None = None) -> dict[str, int]:
    bundle = bundle or load_content()
    skills: dict[str, Skill] = {s.code: s for s in session.scalars(select(Skill))}
    for spec in bundle.skills:
        row = skills.get(spec.code) or Skill(code=spec.code)
        row.domain, row.cefr_range = spec.domain, spec.cefr_range
        row.name_es, row.description_es = spec.name_es, spec.description_es
        row.prerequisites, row.rubric_version = list(spec.prerequisites), spec.rubric_version
        session.add(row)
        skills[spec.code] = row
    session.flush()

    items: dict[tuple[str, int], ExerciseItem] = {
        (i.external_id, i.version): i for i in session.scalars(select(ExerciseItem))
    }
    for item_spec in bundle.items:
        key = (item_spec.id, item_spec.version)
        item = items.get(key) or ExerciseItem(external_id=item_spec.id, version=item_spec.version)
        item.skill_id = skills[item_spec.skill].id
        item.type, item.cefr_estimate, item.difficulty = (
            item_spec.type,
            item_spec.cefr_estimate,
            item_spec.difficulty,
        )
        item.prompt = item_spec.prompt.model_dump(exclude_none=True)
        item.answer_schema = item_spec.answer.model_dump(exclude_none=True)
        item.rubric_version, item.license = item_spec.rubric_version, item_spec.license
        item.review_status = item_spec.review_status
        item.published = item_spec.review_status in ("pilot", "approved")
        item.pool = item_spec.pool
        session.add(item)
        items[key] = item
    session.flush()

    latest_item = {i.id: items[(i.id, i.version)] for i in bundle.items}
    for lesson_spec in bundle.lessons:
        lesson = session.scalar(
            select(Lesson).where(Lesson.slug == lesson_spec.slug, Lesson.version == lesson_spec.version)
        ) or Lesson(slug=lesson_spec.slug, version=lesson_spec.version)
        lesson.title_es, lesson.level = lesson_spec.title_es, lesson_spec.level
        lesson.skill_id = skills[lesson_spec.skill].id
        lesson.content = lesson_spec.content.model_dump(exclude_none=True)
        lesson.review_status = lesson_spec.review_status
        lesson.published = lesson_spec.review_status in ("pilot", "approved")
        session.add(lesson)
        session.flush()
        session.execute(delete(LessonItem).where(LessonItem.lesson_id == lesson.id))
        for position, ref in enumerate(lesson_spec.items):
            session.add(
                LessonItem(lesson_id=lesson.id, exercise_id=latest_item[ref.id].id, position=position, role=ref.role)
            )
    session.flush()
    return {"skills": len(bundle.skills), "items": len(bundle.items), "lessons": len(bundle.lessons)}


if __name__ == "__main__":
    from app.db.session import _session_factory

    with _session_factory()() as s, s.begin():
        print(seed_content(s))
