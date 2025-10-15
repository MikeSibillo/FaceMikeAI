from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional


@dataclass
class FirstOrderLowpass:
    fs_hz: float
    fc_hz: float
    y: float = 0.0

    def __post_init__(self) -> None:
        self._update_coeffs()

    def _update_coeffs(self) -> None:
        # bilinear transform of RC
        dt = 1.0 / self.fs_hz
        rc = 1.0 / (2.0 * math.pi * max(self.fc_hz, 1e-3))
        alpha = dt / (rc + dt)
        self.alpha = alpha

    def reset(self, y0: float = 0.0) -> None:
        self.y = y0

    def step(self, x: float) -> float:
        self.y += self.alpha * (x - self.y)
        return self.y


class Decimator:
    def __init__(self, factor: int):
        assert factor >= 1
        self.factor = factor
        self._count = 0

    def reset(self) -> None:
        self._count = 0

    def step(self) -> bool:
        self._count += 1
        if self._count >= self.factor:
            self._count = 0
            return True
        return False


class RollingRMS:
    def __init__(self, window_len: int):
        assert window_len >= 1
        self.n = window_len
        self.buf = [0.0] * self.n
        self.sum_sq = 0.0
        self.idx = 0
        self.count = 0

    def reset(self) -> None:
        self.buf = [0.0] * self.n
        self.sum_sq = 0.0
        self.idx = 0
        self.count = 0

    def step(self, x: float) -> float:
        old = self.buf[self.idx]
        self.sum_sq -= old * old
        self.buf[self.idx] = x
        self.sum_sq += x * x
        self.idx = (self.idx + 1) % self.n
        self.count = min(self.count + 1, self.n)
        if self.count < self.n:
            return math.sqrt(self.sum_sq / max(self.count, 1))
        return math.sqrt(self.sum_sq / self.n)
