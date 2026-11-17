"""Límite simple de peticiones por persona (ventana deslizante en memoria).

Suficiente para el piloto con una sola instancia de la API; con varias instancias habría que moverlo a Redis.
Protege el presupuesto de IA y la base ante un bucle del cliente o un abuso, no reemplaza las cuotas diarias.
"""

import time
import uuid
from collections import deque
from threading import Lock

from app.core.errors import ApiError


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[uuid.UUID, deque[float]] = {}
        self._lock = Lock()

    def check(self, key: uuid.UUID, now: float | None = None) -> None:
        if self.limit <= 0:
            return
        t = time.monotonic() if now is None else now
        with self._lock:
            hits = self._hits.setdefault(key, deque())
            while hits and hits[0] <= t - self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                raise ApiError(
                    429, "RATE_LIMITED", "Vas muy rápido. Espera unos segundos y vuelve a intentarlo.", retryable=True
                )
            hits.append(t)
