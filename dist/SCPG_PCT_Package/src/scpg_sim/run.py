from __future__ import annotations

import argparse
import math
from dataclasses import dataclass
from typing import Dict, List

import matplotlib.pyplot as plt
import numpy as np

from .config import SimConfig
from .plant import BalancedPlant, PlantParams
from .filters import Decimator, RollingRMS
from .estimators import StreamingPhasor, RLSImpedanceEstimator, estimate_touch_current_rms, PCIFeatures, PCIComputer, wrap_phase_rad
from .controller import SCPGController


@dataclass
class SimLog:
    t: List[float]
    vdiff: List[float]
    vcm: List[float]
    iout: List[float]
    vdiff_rms: List[float]
    vcm_rms: List[float]
    pci: List[float]
    amp_cmd_rms: List[float]
    tripped: List[bool]


def simulate(cfg: SimConfig, seconds: float = 2.0, scenario: str = "normal", plot: bool = True) -> SimLog:
    fs = cfg.fs_control_hz
    dt = 1.0 / fs
    steps = int(seconds * fs)

    plant = BalancedPlant(cfg.f_line_hz, PlantParams(cfg.r_eq_ohm, cfg.x_eq_ohm, cfg.r_load_ohm, cfg.c_y_f), seed=cfg.seed)
    state = plant.reset(cfg.vdiff_rms_target)

    decim = Decimator(cfg.decim_factor)
    fs_decim = cfg.fs_control_hz / cfg.decim_factor
    ph_v = StreamingPhasor(fs_decim, cfg.f_line_hz, ewma_alpha=0.2)
    ph_i = StreamingPhasor(fs_decim, cfg.f_line_hz, ewma_alpha=0.2)

    # RMS windows over decimated stream (10 cycles)
    samples_per_cycle = int(round(fs_decim / cfg.f_line_hz))
    window_len = max(1, cfg.rms_cycles * samples_per_cycle)
    rms_vdiff = RollingRMS(window_len)
    rms_vcm = RollingRMS(window_len)

    rls = RLSImpedanceEstimator(r_load_ohm=cfg.r_load_ohm, lambda_ff=0.995)
    pci_comp = PCIComputer()
    ctrl = SCPGController(cfg)

    # Commands
    amp_cmd_peak, cm_bias_cmd, phase_cmd_offset = ctrl.commands_peak()

    # Logs (decimated)
    t_log: List[float] = []
    vdiff_log: List[float] = []
    vcm_log: List[float] = []
    iout_log: List[float] = []
    vdiff_rms_log: List[float] = []
    vcm_rms_log: List[float] = []
    pci_log: List[float] = []
    amp_cmd_rms_log: List[float] = []
    tripped_log: List[bool] = []

    tripped = False
    for n in range(steps):
        # Scenario injections (simple examples)
        if scenario == "drift" and n == int(0.8 * steps):
            # Inductive drift +20%
            plant.params.x_eq_ohm *= 1.2
        if scenario == "leak" and n == int(0.8 * steps):
            # Increase Y-cap to raise touch current
            plant.params.c_y_f *= 2.5

        # Plant step with held commands if tripped the amplitude is forced to zero
        amp = 0.0 if tripped else amp_cmd_peak
        state, vout_p, vout_n, i_out = plant.step(dt, state, amp, cm_bias_cmd, phase_cmd_offset)
        vdiff = vout_p - vout_n
        vcm = 0.5 * (vout_p + vout_n)

        if decim.step():
            t_cur = n * dt
            # Phasors
            zv = ph_v.step(vdiff)
            zi = ph_i.step(i_out)
            vdiff_rms_est, phase_v = ph_v.estimate_rms_and_phase()
            iout_rms_est, phase_i = ph_i.estimate_rms_and_phase()
            dphi = wrap_phase_rad(phase_v - phase_i)

            vcm_rms_est = rms_vcm.step(vcm)
            _ = rms_vdiff.step(vdiff)

            # RLS estimate of Zs
            r_eq_est, x_eq_est = rls.step(v=vdiff, i=i_out, dt=1.0 / fs_decim, omega_rad_s=2.0 * math.pi * cfg.f_line_hz)

            # Touch current prediction (from Vcm)
            itouch_rms = estimate_touch_current_rms(vcm_rms_est, cfg.f_line_hz, plant.params.c_y_f, cfg.r_body_ohm)

            # PCI
            pci = pci_comp.compute(
                PCIFeatures(
                    vdiff_rms=vdiff_rms_est,
                    vdiff_rms_target=cfg.vdiff_rms_target,
                    vcm_rms=vcm_rms_est,
                    delta_phi_rad=dphi,
                    r_eq_ohm=r_eq_est,
                    x_eq_ohm=x_eq_est,
                    r_nom_ohm=cfg.r_eq_ohm,
                    x_nom_ohm=cfg.x_eq_ohm,
                    itouch_rms_a=itouch_rms,
                    itouch_limit_a=cfg.touch_current_normal_limit_a,
                )
            )

            # Interlocks
            if (pci >= cfg.pci_trip_threshold) or (itouch_rms > cfg.touch_current_normal_limit_a):
                tripped = True

            # Controller step
            st = ctrl.step(dt=1.0 / fs_decim, vdiff_rms_est=vdiff_rms_est, delta_phi_rad=dphi, vcm_rms=vcm_rms_est)
            amp_cmd_peak, cm_bias_cmd, phase_cmd_offset = ctrl.commands_peak()

            # Logs
            t_log.append(t_cur)
            vdiff_log.append(vdiff)
            vcm_log.append(vcm)
            iout_log.append(i_out)
            vdiff_rms_log.append(vdiff_rms_est)
            vcm_rms_log.append(vcm_rms_est)
            pci_log.append(pci)
            amp_cmd_rms_log.append(st.amp_rms_cmd)
            tripped_log.append(tripped)

    if plot:
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), sharex=True)
        ax1.plot(t_log, vdiff_log, label="vdiff [V]", lw=1.2)
        ax1.plot(t_log, vcm_log, label="vcm [V]", lw=1.2)
        ax1.plot(t_log, iout_log, label="iout [A]", lw=1.0)
        ax1.legend(loc="upper right")
        ax1.set_ylabel("V / A")
        ax1.grid(True, alpha=0.3)

        ax2.plot(t_log, pci_log, label="PCI", color="#6a1b9a")
        ax2.axhline(cfg.pci_trip_threshold, color="#999", ls="--", label="PCI threshold")
        ax2.plot(t_log, amp_cmd_rms_log, label="Amp cmd RMS [V]", color="#2a9d8f")
        ax2.step(t_log, [1.0 if x else 0.0 for x in tripped_log], where="post", label="tripped", color="#d62728")
        ax2.legend(loc="upper right")
        ax2.set_xlabel("time [s]")
        ax2.grid(True, alpha=0.3)

        fig.tight_layout()
        plt.show(block=False)

    return SimLog(
        t=t_log,
        vdiff=vdiff_log,
        vcm=vcm_log,
        iout=iout_log,
        vdiff_rms=vdiff_rms_log,
        vcm_rms=vcm_rms_log,
        pci=pci_log,
        amp_cmd_rms=amp_cmd_rms_log,
        tripped=tripped_log,
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="SCPG simulator")
    ap.add_argument("--scenario", default="normal", choices=["normal", "drift", "leak"], help="scenario")
    ap.add_argument("--seconds", type=float, default=2.0, help="simulation time [s]")
    ap.add_argument("--no-plot", action="store_true", help="disable plotting")
    args = ap.parse_args()

    cfg = SimConfig()
    simulate(cfg, seconds=args.seconds, scenario=args.scenario, plot=not args.no_plot)


if __name__ == "__main__":
    main()
