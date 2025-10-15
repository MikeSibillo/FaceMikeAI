from __future__ import annotations

import math
from dataclasses import dataclass

from .config import SimConfig


@dataclass
class ControllerState:
    integ_ev: float = 0.0
    amp_rms_cmd: float = 0.0
    cm_bias_cmd: float = 0.0
    phase_cmd_offset: float = 0.0


class SCPGController:
    def __init__(self, cfg: SimConfig):
        self.cfg = cfg
        self.state = ControllerState(amp_rms_cmd=cfg.vdiff_rms_target)

    @staticmethod
    def _clamp(x: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, x))

    def reset(self) -> None:
        self.state = ControllerState(amp_rms_cmd=self.cfg.vdiff_rms_target)

    def step(self, dt: float, vdiff_rms_est: float, delta_phi_rad: float, vcm_rms: float) -> ControllerState:
        # Errors
        e_v = (self.cfg.vdiff_rms_target - vdiff_rms_est)
        e_phi = -delta_phi_rad

        # PI on amplitude (RMS domain)
        self.state.integ_ev += self.cfg.k_i * e_v * dt
        proportional = self.cfg.k_p * e_v
        amp_rms = self.state.amp_rms_cmd + proportional + self.state.integ_ev

        # Anti-windup via clamping
        amp_rms = self._clamp(amp_rms, 0.0, 2.0 * self.cfg.vdiff_rms_target)
        if amp_rms == 0.0 or amp_rms == 2.0 * self.cfg.vdiff_rms_target:
            # bleed integrator
            self.state.integ_ev *= (1.0 - self.cfg.anti_windup_beta)
        self.state.amp_rms_cmd = amp_rms

        # Phase correction
        self.state.phase_cmd_offset = self._clamp(self.cfg.k_phi * e_phi, -math.radians(10.0), math.radians(10.0))

        # Common-mode bias nudging
        if abs(vcm_rms) > 1e-6:
            self.state.cm_bias_cmd = -self.cfg.k_cm * math.copysign(1.0, vcm_rms)
        else:
            self.state.cm_bias_cmd = 0.0

        return self.state

    def commands_peak(self) -> tuple[float, float, float]:
        # Convert RMS amplitude command to peak differential amplitude
        amp_peak = math.sqrt(2.0) * max(self.state.amp_rms_cmd, 0.0)
        return amp_peak, self.state.cm_bias_cmd, self.state.phase_cmd_offset
