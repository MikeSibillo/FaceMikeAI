from __future__ import annotations

from dataclasses import dataclass
import math
import numpy as np


@dataclass
class PlantState:
    theta_rad: float  # electrical angle 0..2pi
    vcm_bias_v: float
    vdiff_amp_v: float  # peak of differential sinus
    phase_offset_rad: float


@dataclass
class PlantParams:
    r_eq_ohm: float
    x_eq_ohm: float
    r_load_ohm: float
    c_y_f: float


class BalancedPlant:
    """
    Simplified balanced AC source model.

    - Generates differential sinus at 50 Hz with controllable amplitude and phase offset.
    - Common-mode voltage evolves as a first-order dynamic driven by control bias and imbalance.
    - Load current derived from phasor relation with Zs = R + jX and series R_load.
    """

    def __init__(self, f_line_hz: float, params: PlantParams, seed: int = 7):
        self.f_line_hz = f_line_hz
        self.omega = 2.0 * math.pi * f_line_hz
        self.params = params
        self.rng = np.random.default_rng(seed)
        # time constants
        self.tau_vdiff = 2e-3  # amplitude loop dynamics ~2 ms
        self.tau_vcm = 5e-3  # cm bias dynamics ~5 ms
        # small imbalance noise source
        self.vcm_imbalance_k = 0.02

    def reset(self, vdiff_rms_target: float) -> PlantState:
        vdiff_amp = math.sqrt(2.0) * vdiff_rms_target
        return PlantState(theta_rad=0.0, vcm_bias_v=0.0, vdiff_amp_v=vdiff_amp, phase_offset_rad=0.0)

    def step(self, dt: float, state: PlantState, amp_cmd_v: float, cm_bias_cmd: float, phase_cmd_offset: float):
        # advance angle
        theta = (state.theta_rad + self.omega * dt) % (2.0 * math.pi)

        # first-order track to commanded amplitude
        dv = (amp_cmd_v - state.vdiff_amp_v) * (dt / max(self.tau_vdiff, 1e-6))
        vdiff_amp = state.vdiff_amp_v + dv

        # common-mode dynamics with control bias and small stochastic imbalance
        imbalance = self.vcm_imbalance_k * self.rng.standard_normal() * math.sqrt(max(dt, 1e-6))
        dvcm = (
            -state.vcm_bias_v * (dt / max(self.tau_vcm, 1e-6))
            + 2.0 * cm_bias_cmd * dt
            + imbalance
        )
        vcm_bias = state.vcm_bias_v + dvcm

        phase_offset = state.phase_offset_rad + 0.5 * phase_cmd_offset  # relaxed dynamics

        # instantaneous outputs
        vdiff = vdiff_amp * math.sin(theta + phase_offset)
        vout_p = 0.5 * vdiff + vcm_bias
        vout_n = -0.5 * vdiff + vcm_bias

        # load/plant current (phasor-based sinus assumption)
        r_eq = max(self.params.r_eq_ohm, 1e-3)
        x_eq = self.params.x_eq_ohm
        r_load = max(self.params.r_load_ohm, 1e-3)
        # series combination of Zs and R_load
        r_tot = r_eq + r_load
        x_tot = x_eq
        z_mag = math.hypot(r_tot, x_tot)
        z_ang = math.atan2(x_tot, r_tot)

        i_amp = vdiff_amp / max(z_mag, 1e-6)
        i_out = i_amp * math.sin(theta + phase_offset - z_ang)

        next_state = PlantState(theta_rad=theta, vcm_bias_v=vcm_bias, vdiff_amp_v=vdiff_amp, phase_offset_rad=phase_offset)
        return next_state, vout_p, vout_n, i_out
