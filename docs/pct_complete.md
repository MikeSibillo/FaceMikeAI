# SCPG – Safety Compensated Power Generator (PCT completo)

## Titolo dell’invenzione
SCPG – Safety Compensated Power Generator

## Inventore / Richiedente
- Inventore: Michele Valerio Sibillo — Grottammare, Italy
- Richiedente: [da completare]

## Campo dell’invenzione
Elettronica di potenza; sicurezza elettrica e protezione; manutenzione predittiva; controllo embedded con AI per sistemi industriali safety‑critical.

## Stato dell’arte (Background)
I generatori isolati convenzionali e gli alimentatori flottanti riducono i rischi di contatto ma reagiscono per lo più a guasti conclamati. Non anticipano precursori come squilibri di modo comune, deriva di impedenza, errori di fase e leakage imminente. L’assenza di compensazione dinamica del modo comune e di interlock ridondanti a bassa latenza limita l’affidabilità in scenari industriali severi.

## Riassunto
SCPG è una sorgente AC bilanciata e flottante con compensazione safety‑predittiva. Integra: (i) front‑end protetto (ingresso IEC, filtro EMI, limitatore surge); (ii) stadio isolato con uscita differenziale stabile e modo comune minimo; (iii) rete sensori multi‑fisica; (iv) controllore AI‑assistito AIM‑X che stima \(Z_s\), errore di fase e rischio di leakage, calcola un Predictive Confidence Index (PCI) e attua azioni graduate: pre‑alert → retuning → re‑routing → trip. Interlock ridondante con doppio relè e watchdog realizza disconnessione <3 ms.

## Breve descrizione dei disegni
- FIG. 1 — Panoramica e schema a blocchi di SCPG.  
- FIG. 2 — Catena di misura, stima (PLL/SDFT, RLS), controllo PWM/DDS e routing.  
- FIG. 3 — Matrice interlock ridondante (doppi relè) e logica di trip.  
- FIG. 4 — Forme d’onda tipiche: \(v_{diff}\), \(v_{cm}\), \(i_{out}\), PCI.  
- FIG. 5 — Stima \(Z_s=R_{eq}+jX_{eq}\) via RLS con drift.  
- FIG. 6 — Modello corrente di contatto secondo IEC 60990.  

## Elenco dei riferimenti
100 SCPG; 110 Ingresso IEC; 115 Filtro EMI; 120 Limitatore surge; 130 Trasformatore d’isolamento; 135 Buffer/driver; 140 Uscita bilanciata; 145 Zs1; 146 Zs2; 150 Rete Y‑capacitors; 160 Sensori V/I; 161 Sensore temperatura; 162 Sensore vibrazione; 170 ADC front‑end; 180 MCU/SoC; 181 PLL/SDFT; 182 RLS; 183 AIM‑X; 184 PWM/DDS; 185 Watchdog; 190 Interlock ridondante; 191 Relè A; 192 Relè B; 195 Logger forense; 200 PCI; 210 Porta diagnostica; 220 Alimentazione ausiliaria.

## Descrizione dettagliata dell’invenzione
### Architettura e funzionamento
La FIG. 1 mostra il front‑end protetto (110, 115, 120), lo stadio isolato (130, 135) che fornisce uscita bilanciata e flottante (140) con rami di impedenza selezionabili (145, 146) per minimizzare \(\Delta V_{cm}\), la rete sensori (160–162) con front‑end ADC (170) e il controllore (180) con blocchi (181–185). Il logger (195) raccoglie dati per analisi forense post‑evento.

[[FIG1]]

### Segnali e obiettivi
Definizioni: \(v_{out}^{\pm}=\pm v_{diff}/2\), \(v_{cm}=(v_{out}^{+}+v_{out}^{-})/2\), \(i_{out}\) sul carico. Obiettivi: \(|v_{cm}|\) minimizzato; \(v_{diff}\) entro ±1% nominale; THD < 2%; \(\Delta\varphi\to 0\).

### Catena di misura, sincronizzazione e filtri
AA RC 3.5 kHz; ADC 16‑bit a 20 kS/s sincronizzato a zero‑cross; decimazione a 2 kS/s; soppressione 120 Hz e notch adattativo 100–180 Hz; finestre RMS su 10 cicli; EWMA \(\lambda=0.2\). Stima di fase con SDFT/PLL (\(\zeta=0.707\), \(\omega_n=2\pi\cdot 12\) rad/s). La FIG. 2 illustra i flussi.

[[FIG2]]

### Stima di impedenza e previsione leakage
RLS con forgetting factor 0.995 stima \(R_{eq}\) e \(X_{eq}\) nel modello \(v=R_{tot}i+L\,di/dt\). La corrente di contatto viene stimata da \(V_{cm}\) e dalla rete Y‑cap vs IEC 60990; il trip è attuato al superamento dei limiti.

[[FIG5]]
[[FIG6]]

### AIM‑X, PCI e legge di controllo
AIM‑X usa feature: \(V_{rms}, I_{rms}, V_{cm,rms}, \Delta\varphi, d\Delta\varphi/dt, \Re/\Im(Z_s), T\), spettri e vibrazioni. L’MLP 128‑64‑32 (GELU) fornisce \(\Delta Z_s\), \(\Delta\varphi\), rischio e SoH. PCI aggrega residui con pesi adattivi e isteresi. La PWM a 40 kHz (dead‑time 300 ns) segue:  
\[ \Delta d = K_p e_v + K_i \int e_v\,dt + K_\varphi e_\varphi + K_{cm}\,\mathrm{sign}(V_{cm,rms}) \]  
con \(K_p=0.06\), \(K_i=5\,s^{-1}\), \(K_\varphi=0.02\), \(K_{cm}=0.015\), anti‑windup \(\beta=0.5\). Routing Zs1/Zs2 minimizza \(\Delta V_{cm}\). Trip predittivo a \(PCI\ge 0.83\) o superamento limiti IEC 60990.

### Forme d’onda ed eventi
La FIG. 4 mostra \(v_{diff}\), \(v_{cm}\), \(i_{out}\) e PCI con soglie operative e transizioni pre‑alert → retune → re‑route → trip.

[[FIG4]]

### Sicurezza, conformità e realizzazione
- Corrente di contatto: ≤0.5 mA (normale), ≤3.5 mA (singolo guasto).  
- Interlock: doppi relè indipendenti, tempo di disconnessione <3 ms, fail‑safe.  
- Termiche: dissipatore ≤85 °C; trasformatore ≤75 °C.  
- EMC: THD(\(v_{diff}\)) < 2% e CISPR 11/32; isolamento/creepage IEC 61558/61010/62368.  
- Meccanica/PCB: enclosure IP54 210×140×80 mm; PCB 4‑layer FR‑4 Tg≥170 °C; creepage/clearance ≥8 mm; ENIG; via termici; guard rings; separazioni EMI; star‑ground.

### Esempi
1) \(V_{cm}\) iniziale elevato → riduzione <2% target in <100 ms.  
2) Drift \(X_{eq}\) +20% → AIM‑X anticipa \(\Delta\varphi\), retuning <50 ms senza trip.  
3) Guasto Y‑cap → PCI sopra soglia → re‑route → trip in 2.4 ms.

### Applicabilità industriale
Banchi prova, alimentazioni sicure per laboratori, pre‑compliance EMC, linee di produzione con diagnostica predittiva, ambiti medicali non patient‑connected.

## Rivendicazioni
1. Generatore AC industriale a compensazione di sicurezza (SCPG) comprendente: front‑end protetto (110, 115, 120); stadio isolato con trasformatore (130) e buffer/driver (135) configurato per un’uscita bilanciata e flottante (140); rete sensori (160–162) con front‑end ADC (170); controllore AIM‑X (183) con PLL/SDFT (181) e stimatore (182) che calcola un indice PCI (200) e comanda PWM/DDS (184) per minimizzare \(v_{cm}\), mantenere \(v_{diff}\) entro ±1% e attuare un interlock ridondante (190) con disconnessione <3 ms.
2. Generatore secondo la rivendicazione 1, in cui la selezione di ramo tra \(Zs_1\) (145) e \(Zs_2\) (146) riduce \(\Delta V_{cm}\) in presenza di drift.
3. Generatore secondo una qualunque delle precedenti, in cui la catena di misura comprende AA RC a 3.5 kHz, ADC 16‑bit a 20 kS/s sincronizzato a zero‑cross, decimazione a 2 kS/s, IIR 120 Hz e notch adattativo 100–180 Hz, finestre RMS su 10 cicli ed EWMA \(\lambda=0.2\).
4. Generatore secondo una qualunque delle precedenti, con PWM a 40 kHz e dead‑time 300 ns, legge di controllo \(\Delta d = K_p e_v + K_i \int e_v\,dt + K_\varphi e_\varphi + K_{cm}\,\mathrm{sign}(V_{cm,rms})\), anti‑windup \(\beta=0.5\).
5. Generatore secondo una qualunque delle precedenti, in cui lo stimatore (182) implementa RLS con forgetting factor 0.995 per stimare \(R_{eq}\) e \(X_{eq}\).
6. Generatore secondo una qualunque delle precedenti, che stima la corrente di contatto a partire da \(V_{cm}\) usando un modello di rete Y‑cap confrontato con la rete corpo IEC 60990, attuando il trip al superamento dei limiti.
7. Generatore secondo una qualunque delle precedenti, in cui AIM‑X impiega un MLP 128‑64‑32 (GELU) che produce \(\Delta Z_s\), \(\Delta\varphi\), Risk e SoH da feature comprendenti \(V_{rms}, I_{rms}, V_{cm,rms}, \Delta\varphi, d\Delta\varphi/dt, \Re/\Im(Z_s), T\) e vibrazioni.
8. Generatore secondo una qualunque delle precedenti, in cui il PCI aggrega residui normalizzati con pesi adattivi e isteresi, innescando azioni graduate: pre‑alert, retuning, re‑routing, trip predittivo.
9. Generatore secondo una qualunque delle precedenti, con matrice di interlock (190) a doppi canali indipendenti che pilotano relè A (191) e B (192) e watchdog (185) in configurazione fail‑safe.
10. Generatore secondo una qualunque delle precedenti, dotato di logger forense (195) che registra segnali, stime e comandi pre/post‑evento con timestamp ad alta risoluzione.
11. Generatore secondo una qualunque delle precedenti, con porta diagnostica (210) per telemetria e aggiornamenti, con limiti di sicurezza sugli attuatori remoti.
12. Generatore secondo una qualunque delle precedenti, in cui Y‑capacitors (150) sono configurati simmetricamente (tipicamente 2.2 nF ciascuno) per minimizzare \(v_{cm}\) mantenendo compatibilità EMC.
13. Generatore secondo una qualunque delle precedenti, in cui la meccanica (enclosure IP54) e la PCB (4 strati, creepage/clearance ≥8 mm) soddisfano IEC 61558/61010/62368.
14. Generatore secondo una qualunque delle precedenti, che seleziona dinamicamente il ramo \(Zs\) per compensare derive termiche o vibrazionali che alterano \(X_{eq}\).
15. Generatore secondo una qualunque delle precedenti, che impone limiti termici (≤85 °C dissipatore; ≤75 °C trasformatore) come condizioni di interlock.
16. Metodo di funzionamento per un generatore secondo una qualunque delle rivendicazioni 1–15, comprendente: campionare tensioni/correnti; derivare \(v_{diff}\) e \(v_{cm}\); stimare fase via PLL/SDFT; calcolare RMS; stimare \(Z_s\) via RLS; calcolare PCI; applicare la legge di controllo PWM; selezionare ramo e attuare trip predittivo; registrare evento.
17. Metodo secondo la rivendicazione 16, in cui il forgetting factor RLS è compreso tra 0.99 e 0.999 ed il notch è adattato nella banda 100–180 Hz.
18. Metodo secondo la rivendicazione 16 o 17, in cui la latenza di trip predittivo è <3 ms dall’innesco PCI o dal superamento dei limiti di corrente di contatto.
19. Supporto di memorizzazione leggibile da elaboratore recante istruzioni che, quando eseguite, implementano il metodo di una qualunque delle rivendicazioni 16–18.
20. Generatore secondo una qualunque delle precedenti, conforme ai limiti THD (CISPR 11/32), ai requisiti di isolamento/creepage (IEC 61558/61010/62368) e ai limiti di corrente di contatto (IEC 60990).

## Abstract
SCPG è una sorgente AC bilanciata con compensazione safety‑predittiva che minimizza modo comune e corrente di contatto, mantiene l’uscita differenziale entro tolleranza e previene i guasti prima della loro manifestazione. Integra front‑end protetto, stadio isolato, rete multisensore, controllore AIM‑X con PCI e interlock ridondante per disconnessione <3 ms.

## Classificazioni proposte (IPC/CPC, indicative)
- IPC: H02H 1/00; H02H 3/00; H02M 7/00; G05F 1/46; G05B 13/02; G01R 19/165; G01R 31/02.  
- CPC (esempi): H02H 3/093; H02M 7/49; H02J 50/00; G05F 1/46; G05B 13/0265; G01R 19/165; G01R 31/28.  
Nota: le classi definitive sono assegnate dall’Ufficio ricevente/esaminatore.

## Dati amministrativi (placeholder)
- Dati di priorità, inventori aggiuntivi, mandatario, lista figure, sequenze (N/A), documenti citati: [da completare].
