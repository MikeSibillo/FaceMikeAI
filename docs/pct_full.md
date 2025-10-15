# SCPG – Safety Compensated Power Generator (Descrizione estesa)

## Titolo dell’invenzione
SCPG – Safety Compensated Power Generator

## Inventore / Richiedente
- Inventore: Michele Valerio Sibillo — Grottammare, Italy
- Richiedente: [da completare]

## Campo dell’invenzione
L’invenzione si riferisce a sistemi di elettronica di potenza con uscita alternata isolata e bilanciata, con particolare riguardo a sicurezza elettrica, prevenzione dei guasti, diagnostica predittiva e controllo embedded assistito da AI per applicazioni industriali safety‑critical.

## Stato dell’arte
I generatori isolati tradizionali e gli alimentatori flottanti riducono i rischi di contatto, ma reagiscono tipicamente a guasti già manifesti (ad esempio sovracorrenti, surriscaldamento), senza anticipare precursori di squilibrio del modo comune, derivate di impedenza, errori di fase o condizioni di leakage anomalo. Mancano inoltre schemi di compensazione dinamica del modo comune e matrici di interlock ridondanti con tempi garantiti nell’ordine dei millisecondi.

## Riassunto dell’invenzione
SCPG introduce una sorgente AC bilanciata e flottante con compensazione safety‑predittiva. Il sistema integra: (i) un front‑end protetto con ingresso IEC, filtro EMI e limitatore di sovratensione; (ii) uno stadio di potenza isolato che genera un’uscita differenziale stabile e a basso modo comune; (iii) una rete di sensori multi‑fisica e un controllore predittivo AIM‑X che stima online drift d’impedenza, errore di fase e rischio di leakage; (iv) una matrice di interlock ridondante con doppio relè e watchdog, in grado di effettuare il trip in meno di 3 ms. Il controllore calcola un indice PCI (Predictive Confidence Index) e attua azioni graduate: pre‑alert (congelamento set‑point e bias), retuning, re‑routing e trip predittivo.

## Breve descrizione dei disegni
- FIG. 1 — Panoramica del sistema e schema a blocchi.
- FIG. 2 — Diagramma di controllo, stima e legge PWM/DDS.
- FIG. 3 — Matrice di interlock ridondante con doppi relè e watchdog.
- FIG. 4 — Forme d’onda rappresentative: vdiff, vcm, iout, PCI.
- FIG. 5 — Stima dell’impedenza Zs tramite RLS con drift.
- FIG. 6 — Modello di corrente di contatto secondo IEC 60990.

## Descrizione dettagliata
### Architettura generale
La FIG. 1 illustra il front‑end protetto (ingresso IEC, filtro EMI, limitatore di surge), il trasformatore di isolamento con buffer/driver, l’uscita bilanciata con rami selezionabili (Zs1/Zs2), la rete dei sensori e il controllore AIM‑X con PLL/SDFT, stimatore RLS, generazione PWM/DDS e watchdog. La matrice di interlock ridondante aziona due relè indipendenti per una disconnessione inferiore a 3 ms.

[[FIG1]]

### Segnali e grandezze di riferimento
Si definiscono: \(v_{out}^{+} = +v_{diff}/2\), \(v_{out}^{-} = -v_{diff}/2\), \(v_{cm} = (v_{out}^{+}+v_{out}^{-})/2\), con obiettivi di \(|v_{cm}|\) minimo, \(v_{diff}\) entro ±1% e THD inferiore al 2%. L’errore di fase \(\Delta\varphi\) tra tensione e corrente è regolato verso zero.

### Catena di misura, filtraggio e sincronizzazione
La FIG. 2 dettaglia la catena di misura: filtro anti‑aliasing RC a 3.5 kHz; ADC a 16 bit a 20 kS/s sincronizzato allo zero‑cross; decimazione a 2 kS/s. Sono impiegati filtri IIR (120 Hz) e un notch adattativo (100–180 Hz). La stima di fase avviene tramite SDFT/PLL con \(\zeta = 0.707\) e \(\omega_n = 2\pi\cdot 12\,\text{rad/s}\).

[[FIG2]]

### Stima predittiva di impedenza e rischio di leakage
Lo stimatore RLS (forgetting factor 0.995) identifica online \(R_{eq}\) e \(X_{eq}\) di \(Z_s = R_{eq} + jX_{eq}\) usando il modello differenziale \(v = R_{tot} i + L\,\mathrm{d}i/\mathrm{d}t\). L’aumento anomalo di \(X_{eq}\) (deriva induttiva) e scarti di \(R_{eq}\) sono precursori di guasto. La corrente di contatto è stimata a partire da \(V_{cm}\) e dal modello degli Y‑capacitors confrontato con la rete corpo IEC 60990; il sistema esegue il trip quando i limiti di sicurezza vengono superati.

[[FIG5]]
[[FIG6]]

### AIM‑X e PCI: feature, modello e azioni
AIM‑X costruisce un vettore di feature (\(V_{rms}, I_{rms}, V_{cm,rms}, \Delta\varphi, \frac{\mathrm{d}\Delta\varphi}{\mathrm{d}t}, \Re/\Im(Z_s), T\), contenuto spettrale e varianza). Un MLP 128‑64‑32 (GELU) produce stime di \(\Delta Z_s\), \(\Delta\varphi\), rischio e SoH. Il PCI aggrega residui normalizzati con pesi adattivi e isteresi; soglie e logica di azione implementano pre‑alert, retuning, re‑routing e trip predittivo.

### Leggi di controllo e scheduling
La FIG. 2 mostra la legge PWM/DDS con dead‑time 300 ns a 40 kHz:
\[ \Delta d = K_p e_v + K_i \int e_v\,dt + K_\varphi e_\varphi + K_{cm} \operatorname{sign}(V_{cm,rms}) \]
con \(K_p=0.06\), \(K_i=5\,\text{s}^{-1}\), \(K_\varphi=0.02\), \(K_{cm}=0.015\) e anti‑windup \(\beta=0.5\). La selezione del ramo \(Zs_1/Zs_2\) minimizza \(\Delta V_{cm}\); il trip predittivo è attivato a \(PCI \ge 0.83\) o quando la corrente di contatto stimata eccede i limiti IEC 60990.

### Forme d’onda tipiche
La FIG. 4 riassume l’andamento temporale di \(v_{diff}\), \(v_{cm}\), \(i_{out}\) e PCI, con evidenza delle soglie operative e delle transizioni di stato (pre‑alert → retune → re‑route → trip).

[[FIG4]]

### Sicurezza e conformità
- Corrente di contatto: ≤0.5 mA in condizioni normali; ≤3.5 mA in singolo guasto.
- Interlock ridondante con doppi relè: tempo di disconnessione <3 ms.
- Limiti termici: dissipatore ≤85 °C; trasformatore ≤75 °C.
- EMC: THD(\(v_{diff}\)) < 2% e conformità CISPR 11/32; isolamento/creepage secondo IEC 61558/61010/62368.

### Realizzazione meccanica e PCB
Enclosure IP54 in alluminio (210×140×80 mm) con star‑ground, feritoie e interassi M4 (180×110 mm). PCB a 4 strati FR‑4 Tg≥170 °C, creepage/clearance ≥8 mm, finitura ENIG, via termici, guard ring, partizioni EMI e ritorni analogico/digitale separati.

### Esempi e risultati
- Riduzione di \(V_{cm}\) inizialmente elevato a <2% del target in <100 ms.
- Drift di \(X_{eq}\) del +20% con retuning entro 50 ms senza trip.
- Guasto Y‑cap simulato: PCI sopra soglia → re‑route → trip in 2.4 ms.

## Matrice di interlock ridondante
La FIG. 3 mostra le sorgenti di trip (PCI, touch current, over‑current, over‑temperature, watchdog), la logica OR per canale e i driver delle bobine verso i relè A/B. I canali sono indipendenti e fail‑safe.

[[FIG3]]

## Rivendicazioni
1) Generatore industriale a compensazione di sicurezza (SCPG) comprendente: un front‑end protetto con ingresso IEC, filtro EMI e limitatore di sovratensione; uno stadio di potenza isolato configurato per fornire un’uscita alternata bilanciata e flottante; una rete di sensori multi‑fisica con front‑end di acquisizione; un controllore predittivo AIM‑X operativamente connesso a una catena di stima (PLL/SDFT e RLS) e a un attuatore PWM/DDS; una matrice di interlock ridondante con doppi relè; in cui il controllore calcola un indice di confidenza predittivo (PCI) e comanda la compensazione per minimizzare \(v_{cm}\), mantenere \(v_{diff}\) entro ±1% e attuare la disconnessione con tempo inferiore a 3 ms.
2) Il generatore della rivendicazione 1, in cui la catena di stima comprende un algoritmo RLS con fattore di dimenticanza compreso tra 0.990 e 0.999, configurato per stimare in tempo reale \(R_{eq}\) e \(X_{eq}\) del percorso di sorgente \(Z_s=R_{eq}+jX_{eq}\).
3) Il generatore di una qualunque delle precedenti, in cui la stima di fase è ottenuta tramite SDFT/PLL con \(\zeta \in [0.6,0.8]\) e \(\omega_n\) compreso tra \(2\pi\cdot 8\) e \(2\pi\cdot 20\,\text{rad/s}\).
4) Il generatore di una qualunque delle precedenti, in cui AIM‑X comprende un MLP con almeno tre strati (≥32 neuroni per strato) e attivazioni non lineari, addestrato a predire \(\Delta Z_s\), \(\Delta\varphi\), rischio e SoH.
5) Il generatore di una qualunque delle precedenti, in cui PCI aggrega residui normalizzati su \(V_{rms}, I_{rms}, V_{cm,rms}, \Delta\varphi, \Re/\Im(Z_s)\) e corrente di contatto stimata, con isteresi per prevenire chatter.
6) Il generatore di una qualunque delle precedenti, in cui la legge di controllo PWM/DDS è \(\Delta d = K_p e_v + K_i \int e_v\,dt + K_\varphi e_\varphi + K_{cm}\,\operatorname{sign}(V_{cm,rms})\) con anti‑windup.
7) Il generatore di una qualunque delle precedenti, in cui la selezione di ramo tra \(Zs_1\) e \(Zs_2\) è determinata per minimizzare \(\Delta V_{cm}\) a parità di \(v_{diff}\).
8) Il generatore di una qualunque delle precedenti, in cui la corrente di contatto è stimata mediante un modello equivalente degli Y‑capacitors e della rete corpo IEC 60990 e il trip è attivato quando tale corrente supera un limite predefinito.
9) Il generatore di una qualunque delle precedenti, in cui il front‑end comprende un filtro EMI conforme a CISPR 11/32 e un limitatore di surge conforme a IEC 61000‑4‑5.
10) Il generatore di una qualunque delle precedenti, in cui la rete sensori comprende almeno sensori di tensione/corrente, temperatura e vibrazione, con acquisizione a 16 bit a 20 kS/s e decimazione a 2 kS/s.
11) Il generatore di una qualunque delle precedenti, in cui il watchdog hardware è configurato per forzare lo stato di interlock in caso di fault del controllore o perdita di clock.
12) Il generatore di una qualunque delle precedenti, in cui il logger forense registra segnali, eventi PCI e comandi di interlock con time‑stamp per analisi post‑evento.
13) Il generatore di una qualunque delle precedenti, in cui \(v_{diff}\) presenta THD inferiore al 2% e lo sfasamento \(\Delta\varphi\) è regolato a valori prossimi a zero.
14) Il generatore di una qualunque delle precedenti, in cui i limiti termici sono imposti a 85 °C sul dissipatore e 75 °C sul trasformatore, con trip termico.
15) Il generatore di una qualunque delle precedenti, realizzato con PCB a 4 strati FR‑4 Tg≥170 °C, creepage/clearance ≥8 mm, finitura ENIG e partizioni EMI con ritorni analogico/digitale separati.
16) Il generatore di una qualunque delle precedenti, in cui l’inviluppo di sicurezza impone corrente di contatto ≤0.5 mA in condizioni normali e ≤3.5 mA in singolo guasto.
17) Metodo di funzionamento per un SCPG che comprende: campionare tensioni e correnti; stimare la fase; stimare \(Z_s\) via RLS; calcolare PCI; applicare azioni graduate includendo retuning, re‑routing e attivare l’interlock ridondante entro 3 ms quando si superano le soglie.
18) Il metodo della rivendicazione 17, in cui i pesi di PCI sono adattati dinamicamente in base allo stato di salute (SoH) stimato.
19) Supporto di memorizzazione leggibile da elaboratore contenente istruzioni che, se eseguite da un controllore, causano l’attuazione del metodo delle rivendicazioni 17–18.
20) Sistema secondo una qualunque delle rivendicazioni precedenti, integrato in un contenitore IP54 210×140×80 mm con interassi M4 180×110 mm e porta diagnostica, destinato a banchi prova industriali e laboratori di pre‑compliance.

## Abstract
Sorgente AC bilanciata con compensazione safety‑predittiva: minimizza modo comune e corrente di contatto, stabilizza \(v_{diff}\) e previene guasti. Integra front‑end protetto, stadio isolato, rete sensori e interlock ridondante governato da AIM‑X. Il controllore calcola un PCI e agisce per gradi: retuning → re‑routing → trip.

## Informazioni amministrative
- Dati di priorità, incaricati, disegni allegati (FIG.1–6), documenti citati: [da completare].

## Classificazioni IPC/CPC (proposta)
- IPC: H02M 7/00; H02H 3/00; G05B 13/02; G01R 31/50.
- CPC: H02M7/219; H02H3/093; G05B13/027; G01R31/50.
- Riferimenti normativi: IEC 60990 (rete corpo); IEC 61558, IEC 61010, IEC 62368 (isolamento/creepage); CISPR 11/32 (EMI); IEC 61000‑4‑5 (surge).

## Elenco dei riferimenti (reference numerals)
100 SCPG; 110 Ingresso IEC; 115 Filtro EMI; 120 Limitatore surge; 130 Trasformatore d’isolamento; 135 Buffer/driver; 140 Uscita bilanciata; 145 Zs1; 146 Zs2; 150 Rete Y‑capacitors; 160 Sensori V/I; 161 Sensore temperatura; 162 Sensore vibrazione; 170 ADC front‑end; 180 MCU/SoC; 181 PLL/SDFT; 182 RLS; 183 AIM‑X; 184 PWM/DDS; 185 Watchdog; 190 Interlock ridondante; 191 Relè A; 192 Relè B; 195 Logger forense; 200 PCI; 210 Porta diagnostica; 220 Alimentazione ausiliaria.

## Dati amministrativi (placeholder)
- Richiedente, indirizzo: [da completare]
- Priorità: [numero domanda, data, paese]
- Agente/mandatario: [da completare]
