# SCPG – Safety Compensated Power Generator

## Inventore / Richiedente
- Inventore: Michele Valerio Sibillo — Grottammare, Italy
- Richiedente: [da completare]

## Campo dell’invenzione
- Elettronica di potenza; sicurezza elettrica; manutenzione predittiva; AI embedded per controllo industriale safety‑critical.

## Stato dell’arte
- I moduli isolati convenzionali reagiscono a guasti conclamati, non anticipano squilibri/leakage. Mancano compensazioni del modo comune, stima predittiva dei drift d’impedenza e interlock ridondanti con tempi <3 ms.

## Riassunto dell’invenzione
- Sorgente AC bilanciata e flottante con compensazione safety‑predittiva per ridurre tensione di modo comune e corrente di contatto, stabilizzare l’uscita differenziale e prevenire i guasti. Il controllore AIM‑X calcola un Predictive Confidence Index (PCI) e attua azioni graduate: retuning → re‑routing → trip, con interlock triplo ridondante.

## Breve descrizione dei disegni
- FIG. 1 — System Overview e schema a blocchi `docs/figures/FIG1_system_overview.svg`
- FIG. 2 — Diagramma di controllo, stima e legge PWM `docs/figures/FIG2_control_diagram.svg`
- FIG. 3 — Matrice di interlock ridondante con doppi relè `docs/figures/FIG3_interlock_matrix.svg`
- FIG. 4 — Forme d’onda tipiche: vdiff, vcm, iout, PCI `docs/figures/FIG4_waveforms.svg`
- FIG. 5 — Stima Zs via RLS con drift `docs/figures/FIG5_impedance_estimation.svg`
- FIG. 6 — Modello corrente di contatto IEC 60990 `docs/figures/FIG6_touch_current_model.svg`

## Elenco dei riferimenti (reference numerals)
100 SCPG; 110 Ingresso IEC; 115 Filtro EMI; 120 Limitatore surge; 130 Trasformatore d’isolamento; 135 Buffer/driver; 140 Uscita bilanciata; 145 Zs1; 146 Zs2; 150 Rete Y‑capacitors; 160 Sensori V/I; 161 Sensore temperatura; 162 Sensore vibrazione; 170 ADC front‑end; 180 MCU/SoC; 181 PLL/SDFT; 182 RLS; 183 AIM‑X; 184 PWM/DDS; 185 Watchdog; 190 Interlock ridondante; 191 Relè A; 192 Relè B; 195 Logger forense; 200 PCI; 210 Porta diagnostica; 220 Alimentazione ausiliaria.

## Descrizione dettagliata
### Architettura
- Front‑end protetto: IEC (110), filtro EMI (115), limitatore sovratensione (120).
- Stadio isolato: trasformatore (130) e buffer/driver (135) per uscita bilanciata (140) con rami selezionabili Zs1 (145) / Zs2 (146).
- Sensori e acquisizione: V/I/T/vibrazioni (160–162) e front‑end ADC (170).
- Controllore: MCU/SoC (180) con PLL/SDFT (181), RLS (182), AIM‑X (183), PWM/DDS (184), watchdog (185).
- Interlock ridondante (190) con doppi relè (191, 192) e logger forense (195).

### Segnali e obiettivi
- v_in(t)=V_m sin(ωt+φ_in), ω=2π·50 Hz; v_out±=±v_diff/2; v_cm=(v_out++v_out−)/2; v_diff=v_out+−v_out−.
- Target: |v_cm| → minimo; v_diff entro ±1%; THD<2%; Δφ≈0.

### Acquisizione, filtraggio e PLL
- AA RC 3.5 kHz; ADC 16‑bit 20 kS/s sync zero‑cross; decimazione a 2 kS/s.
- IIR 120 Hz e notch adattativo (100–180 Hz). RMS su 10 cicli; EWMA λ=0.2.
- PLL/SDFT con ζ=0.707, ω_n=2π·12 rad/s.

### Stima Zs e previsione leakage
- RLS con forgetting factor 0.995 su θ=[R_eq, X_eq]^T.
- Corrente di contatto stimata da V_cm e modello Y‑cap contro rete corpo IEC 60990; trip se oltre limiti.

### AIM‑X e PCI
- Feature: Vrms, Irms, V_cm,rms, Δφ, dΔφ/dt, Re/Im(Z_s), T, spettri, varianza, vibrazioni.
- MLP 128‑64‑32 (GELU) → ΔZ_s, Δφ, Risk, SoH. PCI con pesi adattivi e isteresi.
- Azioni: Pre‑Alert (freeze set‑point, bias PWM ±2%), Retune, Re‑Route, Predictive Trip (<3 ms).

### Legge di controllo e scheduling
- PWM 40 kHz (dead‑time 300 ns). Δd=K_p e_v + K_i∫e_v dt + K_φ e_φ + K_cm sign(V_cm,rms), K_p=0.06, K_i=5 s⁻¹, K_φ=0.02, K_cm=0.015; anti‑windup β=0.5.
- Selezione ramo Zs1/Zs2 per minimizzare ΔV_cm; trip predittivo per PCI≥0.83 o corrente di contatto oltre IEC 60990.

### Sicurezza e conformità
- Corrente di contatto ≤0.5 mA (normale), ≤3.5 mA (singolo guasto); disconnessione <3 ms.
- Termiche: ≤85 °C dissipatore, ≤75 °C trasformatore. EMC: THD(v_diff)<2% e CISPR 11/32; isolamento/creepage IEC 61558/61010/62368.

### Realizzazione meccanica/PCB
- Enclosure IP54 alluminio 210×140×80 mm, M4 180×110 mm, feritoie e star‑ground.
- PCB 4‑layer FR‑4 Tg≥170 °C, creepage/clearance ≥8 mm, ENIG, via termici, guard rings, partizioni EMI con ritorni analogico/digitale separati.

## Esempi
- Riduzione V_cm iniziale elevato a <2% target in <100 ms.
- Drift X_eq +20% anticipato da AIM‑X: retuning entro 50 ms.
- Guasto Y‑cap: PCI sopra soglia → re‑route → trip in 2.4 ms.

## Rivendicazioni (bozza)
1) Generatore SCPG comprendente front‑end protetto (110–120), stadio di potenza isolato (130–135) con uscita bilanciata (140), rete sensori (160–170), controllore AIM‑X (181–184) che calcola PCI e comanda compensazione e interlock (190) per ridurre V_cm, mantenere v_diff entro ±1% e ottenere trip <3 ms.  
2) RLS (182) con λ=0.995 stimante R_eq e X_eq.  
3) AIM‑X con MLP 128‑64‑32 (GELU) per ΔZ_s, Δφ, Risk, SoH.  
4) Legge PWM: Δd=K_p e_v + K_i∫e_v + K_φ e_φ + K_cm sign(V_cm,rms), anti‑windup β=0.5.  
5) Trip quando PCI≥0.83 o corrente di contatto stimata supera IEC 60990.  
6) Metodo: campionare, stimare fase, Z_s via RLS, calcolare PCI, attuare retuning/re‑routing e trip entro 3 ms.  
7) Supporto di memorizzazione recante istruzioni per attuare il metodo.

## Abstract
Sorgente AC bilanciata con compensazione safety‑predittiva: minimizza modo comune e corrente di contatto, stabilizza v_diff e previene guasti. Integra front‑end protetto, stadio isolato, rete sensori e interlock ridondante governato da AIM‑X. Il controllore calcola un PCI e agisce per gradi: retuning → re‑routing → trip.

## Informazioni amministrative
- Dati di priorità, incaricati, disegni allegati (FIG.1–6), documenti citati: [da completare].
