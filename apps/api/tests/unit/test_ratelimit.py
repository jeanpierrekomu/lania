import uuid

import pytest

from app.core.errors import ApiError
from app.core.ratelimit import RateLimiter


def test_blocks_after_limit_and_recovers_after_window() -> None:
    rl, who = RateLimiter(3, 60), uuid.uuid4()
    for t in (0.0, 1.0, 2.0):
        rl.check(who, now=t)
    with pytest.raises(ApiError) as exc:
        rl.check(who, now=3.0)
    assert exc.value.status == 429 and exc.value.retryable
    rl.check(who, now=61.0)  # el primer golpe ya salió de la ventana
    rl.check(uuid.uuid4(), now=3.0)  # otra persona no se ve afectada
