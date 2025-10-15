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

## Rivendicazioni (bozza)
1) Generatore SCPG comprendente front‑end protetto, stadio isolato con uscita bilanciata, rete sensori, controllore AIM‑X che calcola PCI e comanda compensazione e interlock per ridurre \(V_{cm}\), mantenere \(v_{diff}\) entro ±1% e ottenere trip <3 ms.  
2) Stimatore RLS con \(\lambda=0.995\) per \(R_{eq}\) e \(X_{eq}\).  
3) AIM‑X con MLP 128‑64‑32 (GELU) che fornisce \(\Delta Z_s\), \(\Delta\varphi\), rischio e SoH.  
4) Legge PWM: \(\Delta d=K_p e_v + K_i\int e_v dt + K_\varphi e_\varphi + K_{cm} \operatorname{sign}(V_{cm,rms})\) con anti‑windup \(\beta=0.5\).  
5) Trip quando \(PCI\ge 0.83\) o quando la corrente di contatto stimata eccede i limiti IEC 60990.  
6) Metodo: campionamento, stima di fase, stima di \(Z_s\) via RLS, calcolo PCI, retuning/re‑routing e trip entro 3 ms.  
7) Supporto di memorizzazione con istruzioni per attuare il metodo.  

## Abstract
Sorgente AC bilanciata con compensazione safety‑predittiva: minimizza modo comune e corrente di contatto, stabilizza \(v_{diff}\) e previene guasti. Integra front‑end protetto, stadio isolato, rete sensori e interlock ridondante governato da AIM‑X. Il controllore calcola un PCI e agisce per gradi: retuning → re‑routing → trip.
