from dataclasses import dataclass


@dataclass(frozen=True)
class SimConfig:
    f_line_hz: float = 50.0
    fs_adc_hz: float = 20_000.0
    fs_control_hz: float = 20_000.0  # simplified: control at ADC rate
    decim_factor: int = 10  # 20k -> 2k

    vdiff_rms_target: float = 24.0  # RMS line-to-line target [V]
    vcm_target_rms: float = 0.0

    # Control gains
    k_p: float = 0.06
    k_i: float = 5.0
    k_phi: float = 0.02
    k_cm: float = 0.015
    anti_windup_beta: float = 0.5

    # Plant/Load defaults
    r_eq_ohm: float = 20.0
    x_eq_ohm: float = 10.0  # positive => inductive, negative => capacitive
    r_load_ohm: float = 100.0

    # Y-capacitors (each to chassis/earth) and body model (simplified)
    c_y_f: float = 2.2e-9
    r_body_ohm: float = 1000.0

    # Safety thresholds (IEC 60990 inspired)
    touch_current_normal_limit_a: float = 0.5e-3
    touch_current_single_fault_limit_a: float = 3.5e-3

    # PCI threshold
    pci_trip_threshold: float = 0.83

    # Filters
    aa_cut_hz: float = 3500.0
    notch_min_hz: float = 100.0
    notch_max_hz: float = 180.0

    # RMS windows
    rms_cycles: int = 10

    # Numerical
    seed: int = 7
