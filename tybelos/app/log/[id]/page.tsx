"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Decisione, EsitoValore, TicketEscalation } from "@/lib/types";
import { createTicketEscalation, getDecisione, listTickets, saveDecisione, setTicketStato } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";

export default function DecisionDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [d, setD] = useState<Decisione | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [esito, setEsito] = useState<EsitoValore>("sconosciuto");
  const [note, setNote] = useState("");

  const [tickets, setTickets] = useState<TicketEscalation[]>([]);

  useEffect(() => {
    setLoading(true);
    getDecisione(id)
      .then((x) => {
        setD(x ?? null);
        setEsito((x?.esito?.valore ?? "sconosciuto") as EsitoValore);
        setNote(x?.esito?.note ?? "");
      })
      .finally(() => setLoading(false));

    listTickets()
      .then((t) => setTickets(t.filter((k) => k.decisionId === id)))
      .catch(() => setTickets([]));
  }, [id]);

  const chosen = useMemo(() => d?.opzioni.find((o) => o.id === d.sceltaOptionId), [d]);

  async function refreshTickets() {
    const t = await listTickets();
    setTickets(t.filter((k) => k.decisionId === id));
  }

  async function onSaveEsito() {
    if (!d) return;
    setMsg("");
    try {
      const updated = await saveDecisione({ ...d, esito: { valore: esito, note: note.trim() || undefined, at: Date.now() } });
      setD(updated);
      setMsg("Esito aggiornato.");
    } catch {
      setMsg("Errore nel salvataggio esito.");
    }
  }

  async function onEscalation() {
    if (!d) return;
    setMsg("");
    try {
      await createTicketEscalation({
        decisionId: d.id,
        riassunto: `Escalation: "${d.obiettivo}" (scelta: ${chosen?.titolo ?? "non selezionata"})`,
        contesto: d.contesto,
        obiettivo: d.obiettivo,
        vincoli: d.vincoli,
        opzioni: d.opzioni
      });
      await refreshTickets();
      setMsg("Ticket escalation creato (locale).");
    } catch {
      setMsg("Errore nella creazione ticket.");
    }
  }

  async function toggleTicket(ticket: TicketEscalation) {
    const next = ticket.stato === "aperto" ? "chiuso" : "aperto";
    await setTicketStato(ticket.id, next);
    await refreshTickets();
  }

  if (loading) {
    return (
      <div className="container">
        <div className="notice">Caricamento…</div>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          <h1 className="title">Non trovata</h1>
          <p className="subtitle">Questa decisione non esiste (o il DB locale è stato pulito).</p>
          <div className="row" style={{ marginTop: 14 }}>
            <Link className="btn primary" href="/new">
              Nuova decisione
            </Link>
            <Link className="btn" href="/log">
              Torna al log
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <h1 className="title" style={{ marginBottom: 4 }}>
            Dettaglio decisione
          </h1>
          <p className="subtitle">{formatDateTime(d.createdAt)}</p>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <Link className="btn" href="/log">
            Torna al log
          </Link>
          <button className="btn" onClick={onEscalation}>
            Escalation (assistente umano)
          </button>
        </div>
      </div>

      {msg ? <div className="notice" style={{ marginTop: 14 }}>{msg}</div> : null}

      <div className="split" style={{ marginTop: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="h2">{d.obiettivo}</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.35 }}>
            {d.contesto}
          </div>
          <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
            {d.categoria ? <span className="tag">Categoria: {d.categoria}</span> : null}
            <span className="tag">Urgenza: {d.urgenza}</span>
            <span className="tag">Rischio: {d.rischio}</span>
            <span className="tag">Esito: {d.esito?.valore ?? "sconosciuto"}</span>
            {typeof d.score === "number" ? <span className="tag">Score: {Math.round(d.score * 100)}/100</span> : null}
          </div>

          <hr className="hr" />

          <div className="h2">Opzioni (max 2)</div>
          <div className="list" style={{ marginTop: 10 }}>
            {d.opzioni.map((o) => (
              <div
                key={o.id}
                className="item"
                style={{
                  borderColor: d.sceltaOptionId === o.id ? "rgba(124,92,255,0.5)" : undefined,
                  background: d.sceltaOptionId === o.id ? "rgba(124,92,255,0.12)" : undefined
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 900 }}>{o.titolo}</div>
                  {d.sceltaOptionId === o.id ? <span className="tag">Scelta</span> : <span className="tag">Opzione</span>}
                </div>
                <div className="muted" style={{ marginTop: 6, lineHeight: 1.35 }}>
                  {o.descrizione}
                </div>
              </div>
            ))}
          </div>

          <hr className="hr" />

          <div className="h2">Vincoli (snapshot)</div>
          {d.vincoli.length === 0 ? (
            <div className="notice">Nessun vincolo salvato con questa decisione.</div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 10 }}>
              {d.vincoli.map((v) => (
                <div key={v.id} className="item">
                  <div style={{ fontWeight: 800 }}>{v.nome}</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    <span className="tag">{v.type}</span> <span className="tag">valore: {v.valore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="h2">Registra / aggiorna esito</div>
          <p className="subtitle">L’esito è ciò che costruisce memoria decisionale.</p>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">Esito</div>
              <select className="select" value={esito} onChange={(e) => setEsito(e.target.value as EsitoValore)}>
                <option value="sconosciuto">Sconosciuto</option>
                <option value="positivo">Positivo</option>
                <option value="neutro">Neutro</option>
                <option value="negativo">Negativo</option>
              </select>
            </div>
            <div className="field">
              <div className="label">Note</div>
              <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cosa hai imparato? Cosa rifaresti diverso?" />
            </div>
            <button className="btn primary" onClick={onSaveEsito}>
              Salva esito
            </button>
          </div>

          <hr className="hr" />

          <div className="h2">Ticket escalation</div>
          <p className="subtitle">Creati localmente. Stato: aperto/chiuso.</p>

          <div className="list" style={{ marginTop: 10 }}>
            {tickets.length === 0 ? (
              <div className="notice">
                Nessun ticket per questa decisione. Usa “Escalation” se vuoi coinvolgere un umano.
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="item">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontWeight: 900 }}>{t.riassunto}</div>
                    <span className="tag">Stato: {t.stato}</span>
                  </div>
                  <div className="muted" style={{ marginTop: 8, lineHeight: 1.35 }}>
                    Include contesto, opzioni e vincoli (snapshot).
                  </div>
                  <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                    <button className="btn small" onClick={() => toggleTicket(t)}>
                      Segna {t.stato === "aperto" ? "chiuso" : "aperto"}
                    </button>
                    <span className="tag">{formatDateTime(t.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

