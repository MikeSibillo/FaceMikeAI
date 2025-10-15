from __future__ import annotations

import cmath
import math
from dataclasses import dataclass
from typing import Tuple


def wrap_phase_rad(phi: float) -> float:
    while phi > math.pi:
        phi -= 2.0 * math.pi
    while phi < -math.pi:
        phi += 2.0 * math.pi
    return phi


class StreamingPhasor:
    """
    Streaming single-bin complex phasor estimator at fundamental frequency.
    Uses an EWMA over x[n] * exp(-j*2π f0 n / fs). For a sinus x(t)=A·sin(ω0 t+φ),
    the phasor magnitude tends to A/2 and the angle tracks φ up to a constant.
    """

    def __init__(self, fs_hz: float, f0_hz: float, ewma_alpha: float = 0.2) -> None:
        self.fs_hz = fs_hz
        self.f0_hz = f0_hz
        self.ewma_alpha = ewma_alpha
        self._rot = cmath.exp(-1j * 2.0 * math.pi * (self.f0_hz / self.fs_hz))
        self.reset()

    def reset(self) -> None:
        self._z = 0j
        self._exp = 1.0 + 0.0j

    def step(self, x: float) -> complex:
        self._exp *= self._rot
        target = x * self._exp
        self._z = (1.0 - self.ewma_alpha) * self._z + self.ewma_alpha * target
        return self._z

    @property
    def phasor(self) -> complex:
        return self._z

    def estimate_rms_and_phase(self) -> Tuple[float, float]:
        # For sinus, |z| ≈ A/2, where A is peak amplitude
        peak = 2.0 * abs(self._z)
        rms = peak / math.sqrt(2.0)
        phase = math.atan2(self._z.imag, self._z.real)
        return rms, phase


@dataclass
class RLSState:
    theta_r: float  # estimated total series resistance [ohm]
    theta_l_h: float  # estimated inductance [H] (can be negative for capacitive equivalent)
    p11: float
    p12: float
    p22: float


class RLSImpedanceEstimator:
    """
    RLS on model: v = R_tot * i + L * di/dt. X_eq = ω * L.
    The source series R_eq is obtained by subtracting known load resistance.
    """

    def __init__(self, r_load_ohm: float, lambda_ff: float = 0.995) -> None:
        self.r_load_ohm = max(r_load_ohm, 1e-6)
        self.lambda_ff = lambda_ff
        # Initialize with high uncertainty
        self.state = RLSState(theta_r=self.r_load_ohm, theta_l_h=0.0, p11=1e3, p12=0.0, p22=1e3)
        self._i_prev: float | None = None
        self._dt_prev: float | None = None

    def reset(self) -> None:
        self.state = RLSState(theta_r=self.r_load_ohm, theta_l_h=0.0, p11=1e3, p12=0.0, p22=1e3)
        self._i_prev = None
        self._dt_prev = None

    def step(self, v: float, i: float, dt: float, omega_rad_s: float) -> Tuple[float, float]:
        if self._i_prev is None or self._dt_prev is None:
            self._i_prev = i
            self._dt_prev = dt
            return 0.0, 0.0

        di_dt = (i - self._i_prev) / max(dt, 1e-9)
        self._i_prev = i
        self._dt_prev = dt

        # phi = [i, di_dt]
        p11, p12, p22 = self.state.p11, self.state.p12, self.state.p22
        den = self.lambda_ff + i * (p11 * i + p12 * di_dt) + di_dt * (p12 * i + p22 * di_dt)
        if den <= 0.0:
            den = self.lambda_ff
        k1 = (p11 * i + p12 * di_dt) / den
        k2 = (p12 * i + p22 * di_dt) / den

        # prediction error
        v_hat = self.state.theta_r * i + self.state.theta_l_h * di_dt
        err = v - v_hat

        # update theta
        theta_r = self.state.theta_r + k1 * err
        theta_l_h = self.state.theta_l_h + k2 * err

        # update P
        p11_new = (p11 - k1 * (p11 * i + p12 * di_dt)) / self.lambda_ff
        p12_new = (p12 - k1 * (p12 * i + p22 * di_dt)) / self.lambda_ff
        p22_new = (p22 - k2 * (p12 * i + p22 * di_dt)) / self.lambda_ff

        self.state = RLSState(theta_r=theta_r, theta_l_h=theta_l_h, p11=p11_new, p12=p12_new, p22=p22_new)

        # Separate source Req from total by subtracting known load
        r_eq = max(theta_r - self.r_load_ohm, 0.0)
        x_eq = omega_rad_s * theta_l_h
        return r_eq, x_eq


def estimate_touch_current_rms(vcm_rms_v: float, f_line_hz: float, c_y_f: float, r_body_ohm: float) -> float:
    """
    Simplified touch current estimate. Common-mode drives path through Y-caps and body network.
    Approximate admittance as: Y ≈ jω·2Cy + 1/R_body. Use magnitude with Vcm_rms.
    """
    omega = 2.0 * math.pi * f_line_hz
    y_mag = math.hypot(omega * (2.0 * c_y_f), 1.0 / max(r_body_ohm, 1e-6))
    return vcm_rms_v * y_mag


@dataclass
class PCIFeatures:
    vdiff_rms: float
    vdiff_rms_target: float
    vcm_rms: float
    delta_phi_rad: float
    r_eq_ohm: float
    x_eq_ohm: float
    r_nom_ohm: float
    x_nom_ohm: float
    itouch_rms_a: float
    itouch_limit_a: float


class PCIComputer:
    def __init__(self) -> None:
        self._y: float = 0.0  # for hysteresis filtering

    @staticmethod
    def _clamp(x: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, x))

    def compute(self, f: PCIFeatures) -> float:
        # Normalized residuals
        e_v = abs(f.vdiff_rms - f.vdiff_rms_target) / max(f.vdiff_rms_target, 1e-6)
        e_v = self._clamp(e_v / 0.02, 0.0, 1.5)  # 2% band to full-scale

        e_cm = f.vcm_rms / max(0.05 * f.vdiff_rms_target, 1e-6)  # 5% of target rms as ref
        e_cm = self._clamp(e_cm, 0.0, 1.5)

        e_phi = abs(f.delta_phi_rad) / math.radians(5.0)  # 5° ref
        e_phi = self._clamp(e_phi, 0.0, 1.5)

        e_zr = abs(f.r_eq_ohm - f.r_nom_ohm) / max(0.2 * max(f.r_nom_ohm, 1e-6), 1e-6)  # 20% band
        e_zr = self._clamp(e_zr, 0.0, 1.5)
        e_zx = abs(f.x_eq_ohm - f.x_nom_ohm) / max(0.2 * max(abs(f.x_nom_ohm), 1e-6), 1e-6)
        e_zx = self._clamp(e_zx, 0.0, 1.5)

        e_leak = f.itouch_rms_a / max(f.itouch_limit_a, 1e-9)
        e_leak = self._clamp(e_leak, 0.0, 1.5)

        # Weights (sum ~1)
        w_v, w_cm, w_phi, w_z, w_leak = 0.20, 0.20, 0.15, 0.25, 0.20
        pci_raw = w_v * e_v + w_cm * e_cm + w_phi * e_phi + w_z * 0.5 * (e_zr + e_zx) + w_leak * e_leak

        # Hysteresis EWMA to avoid chatter
        alpha = 0.2
        self._y = (1.0 - alpha) * self._y + alpha * pci_raw
        return float(self._clamp(self._y, 0.0, 1.5))
