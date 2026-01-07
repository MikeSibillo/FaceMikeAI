"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DecisionOption, Decisione, EsitoValore, Rischio, Urgenza, Vincolo } from "@/lib/types";
import { generaProposta } from "@/lib/generator";
import { createTicketEscalation, listVincoli, saveDecisione } from "@/lib/repo";

type PredictResponse = { score: number; model: string; note: string };

async function predictScore(payload: unknown): Promise<PredictResponse> {
  const res = await fetch("/api/predict", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("predict failed");
  return (await res.json()) as PredictResponse;
}

export default function NewDecisionPage() {
  const [allVincoli, setAllVincoli] = useState<Vincolo[]>([]);
  const [selectedVincoliIds, setSelectedVincoliIds] = useState<Record<string, boolean>>({});

  const [categoria, setCategoria] = useState("");
  const [contesto, setContesto] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [urgenza, setUrgenza] = useState<Urgenza>("media");
  const [rischio, setRischio] = useState<Rischio>("medio");

  const [opzioni, setOpzioni] = useState<DecisionOption[]>([]);
  const [sceltaId, setSceltaId] = useState<string | undefined>(undefined);
  const [score, setScore] = useState<number | undefined>(undefined);
  const [scoreMeta, setScoreMeta] = useState<string>("");

  const [esito, setEsito] = useState<EsitoValore>("sconosciuto");
  const [noteEsito, setNoteEsito] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    listVincoli()
      .then((v) => {
        setAllVincoli(v);
        const initial: Record<string, boolean> = {};
        for (const x of v) initial[x.id] = true;
        setSelectedVincoliIds(initial);
      })
      .catch(() => setAllVincoli([]));
  }, []);

  const selectedVincoli = useMemo(
    () => allVincoli.filter((v) => selectedVincoliIds[v.id]),
    [allVincoli, selectedVincoliIds]
  );

  const canGenerate = contesto.trim().length > 0 && obiettivo.trim().length > 0;

  async function onGenerate() {
    setMsg("");
    if (!canGenerate) {
      setMsg("Compila almeno Contesto e Obiettivo.");
      return;
    }
    const proposta = generaProposta({ contesto, obiettivo, vincoli: selectedVincoli, urgenza, rischio });
    setOpzioni(proposta);
    setSceltaId(undefined);

    try {
      const predicted = await predictScore({ contesto, obiettivo, vincoli: selectedVincoli, urgenza, rischio, opzioni: proposta });
      setScore(predicted.score);
      setScoreMeta(`${predicted.model}`);
    } catch {
      setScore(undefined);
      setScoreMeta("");
    }
  }

  async function onSaveDecision(createEscalation?: boolean) {
    setMsg("");
    if (opzioni.length === 0) {
      setMsg("Prima genera una proposta (1–2 opzioni).");
      return;
    }
    if (!sceltaId) {
      setMsg("Seleziona una opzione.");
      return;
    }
    setSaving(true);
    try {
      const base: Omit<Decisione, "id" | "createdAt" | "updatedAt"> = {
        categoria: categoria.trim() || undefined,
        contesto: contesto.trim(),
        obiettivo: obiettivo.trim(),
        vincoli: selectedVincoli,
        urgenza,
        rischio,
        opzioni,
        sceltaOptionId: sceltaId,
        esito: { valore: esito, note: noteEsito.trim() || undefined, at: Date.now() },
        score
      };
      const saved = await saveDecisione(base);

      if (createEscalation) {
        const chosen = opzioni.find((o) => o.id === sceltaId);
        await createTicketEscalation({
          decisionId: saved.id,
          riassunto: `Serve un umano: "${saved.obiettivo}" (scelta: ${chosen?.titolo ?? "?"})`,
          contesto: saved.contesto,
          obiettivo: saved.obiettivo,
          vincoli: saved.vincoli,
          opzioni: saved.opzioni
        });
      }

      setMsg(createEscalation ? "Decisione salvata + ticket escalation creato." : "Decisione salvata.");
      // reset minimal, keep fields for iteration
    } catch {
      setMsg("Errore nel salvataggio (IndexedDB).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="split">
        <div className="card" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <h1 className="title" style={{ marginBottom: 4 }}>
                Nuova decisione
              </h1>
              <p className="subtitle">Compila il contesto, genera 1–2 opzioni, scegli, registra esito.</p>
            </div>
            <Link className="btn" href="/log">
              Vai al log
            </Link>
          </div>

          <div className="grid" style={{ marginTop: 14 }}>
            <div className="field">
              <div className="label">Categoria (opzionale)</div>
              <input className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Es. lavoro, salute, famiglia…" />
            </div>

            <div className="field">
              <div className="label">Contesto</div>
              <textarea className="textarea" value={contesto} onChange={(e) => setContesto(e.target.value)} placeholder="Cosa sta succedendo? Qual è la situazione reale?" />
            </div>

            <div className="field">
              <div className="label">Obiettivo</div>
              <input className="input" value={obiettivo} onChange={(e) => setObiettivo(e.target.value)} placeholder="Che risultato vuoi ottenere?" />
            </div>

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div className="field">
                <div className="label">Urgenza</div>
                <select className="select" value={urgenza} onChange={(e) => setUrgenza(e.target.value as Urgenza)}>
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="field">
                <div className="label">Rischio</div>
                <select className="select" value={rischio} onChange={(e) => setRischio(e.target.value as Rischio)}>
                  <option value="basso">Basso</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
            </div>

            <div className="field">
              <div className="label">Vincoli applicati</div>
              {allVincoli.length === 0 ? (
                <div className="notice">Nessun vincolo trovato. Vai su “Vincoli” per crearli.</div>
              ) : (
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  {allVincoli.map((v) => (
                    <label
                      key={v.id}
                      className="item"
                      style={{ cursor: "pointer", userSelect: "none", display: "grid", gap: 8 }}
                    >
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 800 }}>{v.nome}</div>
                        <input
                          type="checkbox"
                          checked={!!selectedVincoliIds[v.id]}
                          onChange={(e) => setSelectedVincoliIds((prev) => ({ ...prev, [v.id]: e.target.checked }))}
                          style={{ width: 22, height: 22 }}
                        />
                      </div>
                      <div className="muted">
                        <span className="tag">{v.type}</span> <span className="tag">valore: {v.valore}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="row" style={{ flexWrap: "wrap" }}>
              <button className="btn primary" onClick={onGenerate} disabled={!canGenerate}>
                Genera proposta (max 2 opzioni)
              </button>
              {score !== undefined ? (
                <span className="pill">
                  Score (stub): <b>{Math.round(score * 100)}</b>/100 <span className="muted">{scoreMeta}</span>
                </span>
              ) : (
                <span className="pill">Score: n/d</span>
              )}
            </div>

            {msg ? <div className="notice">{msg}</div> : null}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="h2">Proposta → Scelta → Esito</div>
          <p className="subtitle">Seleziona una sola opzione. Registra esito adesso o dopo dal dettaglio nel log.</p>

          <div className="list" style={{ marginTop: 12 }}>
            {opzioni.length === 0 ? (
              <div className="notice">Nessuna proposta ancora. Compila i campi e premi “Genera proposta”.</div>
            ) : (
              opzioni.map((o) => (
                <label
                  key={o.id}
                  className="item"
                  style={{
                    cursor: "pointer",
                    borderColor: sceltaId === o.id ? "rgba(124,92,255,0.5)" : undefined,
                    background: sceltaId === o.id ? "rgba(124,92,255,0.12)" : undefined
                  }}
                >
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{o.titolo}</div>
                    <input
                      type="radio"
                      name="scelta"
                      checked={sceltaId === o.id}
                      onChange={() => setSceltaId(o.id)}
                      style={{ width: 22, height: 22 }}
                    />
                  </div>
                  <div className="muted" style={{ marginTop: 8, lineHeight: 1.35 }}>
                    {o.descrizione}
                  </div>
                </label>
              ))
            )}
          </div>

          <hr className="hr" />

          <div className="grid">
            <div className="field">
              <div className="label">Esito</div>
              <select className="select" value={esito} onChange={(e) => setEsito(e.target.value as EsitoValore)}>
                <option value="sconosciuto">Sconosciuto (per ora)</option>
                <option value="positivo">Positivo</option>
                <option value="neutro">Neutro</option>
                <option value="negativo">Negativo</option>
              </select>
            </div>
            <div className="field">
              <div className="label">Note esito (opzionale)</div>
              <textarea className="textarea" value={noteEsito} onChange={(e) => setNoteEsito(e.target.value)} placeholder="Cosa hai imparato? Cosa rifaresti uguale/diverso?" />
            </div>

            <div className="row" style={{ flexWrap: "wrap" }}>
              <button className="btn primary" onClick={() => onSaveDecision(false)} disabled={saving}>
                {saving ? "Salvo…" : "Salva decisione"}
              </button>
              <button className="btn" onClick={() => onSaveDecision(true)} disabled={saving}>
                {saving ? "…" : "Escalation (assistente umano)"}
              </button>
              <span className="pill">Ticket creati localmente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

