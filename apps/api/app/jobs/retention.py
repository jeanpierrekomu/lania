"""Job diario de retención (docs/security/privacy.md). Uso: `uv run python -m app.jobs.retention`."""

from datetime import UTC, datetime

from app.db.session import _session_factory
from app.domain.privacy.service import purge_expired_conversations, purge_reply_audio


def main() -> None:
    with _session_factory()() as db, db.begin():
        now = datetime.now(UTC)
        removed = purge_expired_conversations(db, now)
        audio = purge_reply_audio(db, now)
    print(f"retention: {removed} conversaciones vencidas y {audio} audios de respuestas borrados")


if __name__ == "__main__":
    main()
