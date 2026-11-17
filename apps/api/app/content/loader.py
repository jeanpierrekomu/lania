"""Carga y valida el contenido YAML de `packages/content-seeds`."""

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from app.content.models import (
    DiagnosticSpec,
    EpisodeSpec,
    ItemSpec,
    LessonSpec,
    MissionSpec,
    ReadingSpec,
    ScenarioSpec,
    SkillSpec,
)

DEFAULT_CONTENT_DIR = Path(__file__).resolve().parents[4] / "packages" / "content-seeds"


@dataclass(frozen=True)
class ContentBundle:
    skills: list[SkillSpec]
    items: list[ItemSpec]
    lessons: list[LessonSpec]
    diagnostics: list[DiagnosticSpec]
    episodes: list[EpisodeSpec]
    scenarios: list[ScenarioSpec]
    readings: list[ReadingSpec]
    missions: list[MissionSpec]


def _read(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path}: se esperaba un mapa YAML")
    return data


def load_content(content_dir: Path = DEFAULT_CONTENT_DIR) -> ContentBundle:
    skills = [
        SkillSpec.model_validate(s) for f in sorted((content_dir / "skills").glob("*.yaml")) for s in _read(f)["skills"]
    ]
    items = [
        ItemSpec.model_validate(i) for f in sorted((content_dir / "items").glob("*.yaml")) for i in _read(f)["items"]
    ]
    lessons = [LessonSpec.model_validate(_read(f)) for f in sorted((content_dir / "lessons").glob("*.yaml"))]
    diagnostics = [
        DiagnosticSpec.model_validate(_read(f)) for f in sorted((content_dir / "diagnostics").glob("*.yaml"))
    ]

    skill_codes = {s.code for s in skills}
    if len(skill_codes) != len(skills):
        raise ValueError("códigos de habilidad duplicados")
    item_keys = {(i.id, i.version) for i in items}
    if len(item_keys) != len(items):
        raise ValueError("ítems duplicados (id, version)")
    item_ids = {i.id for i in items}
    by_id = {i.id: i for i in items}
    for skill in skills:
        missing = set(skill.prerequisites) - skill_codes
        if missing:
            raise ValueError(f"{skill.code}: prerequisitos inexistentes {missing}")
    for item in items:
        if item.skill not in skill_codes:
            raise ValueError(f"{item.id}: habilidad desconocida {item.skill}")
    for lesson in lessons:
        if lesson.skill not in skill_codes:
            raise ValueError(f"{lesson.slug}: habilidad desconocida")
        for ref in lesson.items:
            if ref.id not in item_ids:
                raise ValueError(f"{lesson.slug}: ítem inexistente {ref.id}")
            if by_id[ref.id].pool != "practice":
                raise ValueError(f"{lesson.slug}: {ref.id} es de diagnóstico; no se usa en lecciones")
    for diag in diagnostics:
        seen: set[str] = set()
        for block in diag.blocks:
            for item_id in block.items:
                diag_item = by_id.get(item_id)
                if diag_item is None:
                    raise ValueError(f"{diag.version}: ítem inexistente {item_id}")
                if diag_item.pool != "diagnostic":
                    raise ValueError(f"{diag.version}: {item_id} debe tener pool: diagnostic")
                if item_id in seen:
                    raise ValueError(f"{diag.version}: {item_id} repetido")
                seen.add(item_id)
                if (block.id == "writing") != (diag_item.type == "open_response"):
                    raise ValueError(f"{diag.version}: {item_id} no corresponde al bloque {block.id}")
    episodes = [EpisodeSpec.model_validate(_read(f)) for f in sorted((content_dir / "listening").glob("*.yaml"))]
    for ep in episodes:
        for item_id in ep.questions:
            q = by_id.get(item_id)
            if q is None:
                raise ValueError(f"{ep.slug}: pregunta inexistente {item_id}")
            if q.pool != "listening" or q.type != "choice":
                raise ValueError(f"{ep.slug}: {item_id} debe ser choice con pool: listening")
    if len({e.slug for e in episodes}) != len(episodes):
        raise ValueError("slugs de episodios repetidos")
    scenarios = [ScenarioSpec.model_validate(_read(f)) for f in sorted((content_dir / "speaking").glob("*.yaml"))]
    if len({sc.slug for sc in scenarios}) != len(scenarios):
        raise ValueError("slugs de escenarios repetidos")
    readings = [ReadingSpec.model_validate(_read(f)) for f in sorted((content_dir / "reading").glob("*.yaml"))]
    for rd in readings:
        for item_id in rd.questions:
            q = by_id.get(item_id)
            if q is None:
                raise ValueError(f"{rd.slug}: pregunta inexistente {item_id}")
            if q.pool != "reading" or q.type != "choice":
                raise ValueError(f"{rd.slug}: {item_id} debe ser choice con pool: reading")
    if len({r.slug for r in readings}) != len(readings):
        raise ValueError("slugs de lecturas repetidos")
    missions = [MissionSpec.model_validate(_read(f)) for f in sorted((content_dir / "missions").glob("*.yaml"))]
    refs = {
        "lesson": {lesson.slug for lesson in lessons},
        "listening": {e.slug for e in episodes},
        "reading": {r.slug for r in readings},
        "speaking": {sc.slug for sc in scenarios},
        "writing": {i.id for i in items if i.pool == "writing_lab"},
    }
    for mission in missions:
        for step in mission.steps:
            if step.ref not in refs[step.kind]:
                raise ValueError(f"{mission.slug}: {step.kind} inexistente {step.ref}")
    return ContentBundle(
        skills=skills,
        items=items,
        lessons=lessons,
        diagnostics=diagnostics,
        episodes=episodes,
        scenarios=scenarios,
        readings=readings,
        missions=missions,
    )
