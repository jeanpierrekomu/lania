"""Reloj inyectable. En local permite «adelantar días» para probar repasos diferidos (solo dev)."""

from datetime import UTC, datetime, timedelta


class Clock:
    def __init__(self) -> None:
        self.offset = timedelta(0)

    def now(self) -> datetime:
        return datetime.now(UTC) + self.offset


clock = Clock()


def get_now() -> datetime:
    return clock.now()
