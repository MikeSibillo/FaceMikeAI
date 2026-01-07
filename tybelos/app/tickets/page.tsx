"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TicketEscalation } from "@/lib/types";
import { listTickets, setTicketStato } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";

type Filter = "tutti" | "aperto" | "chiuso";

export default function TicketsPage() {
  const [all, setAll] = useState<TicketEscalation[]>([]);
  const [filter, setFilter] = useState<Filter>("aperto");
  const [msg, setMsg] = useState("");

  async function refresh() {
    const t = await listTickets();
    setAll(t);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (filter === "tutti") return all;
    return all.filter((t) => t.stato === filter);
  }, [all, filter]);

  async function toggle(t: TicketEscalation) {
    setMsg("");
    try {
      await setTicketStato(t.id, t.stato === "aperto" ? "chiuso" : "aperto");
      await refresh();
    } catch {
      setMsg("Errore aggiornamento ticket.");
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <h1 className="title" style={{ marginBottom: 4 }}>
            Escalation (assistente umano)
          </h1>
          <p className="subtitle">Ticket locali con riassunto (contesto, opzioni, vincoli) e stato.</p>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <Link className="btn primary" href="/new">
            Nuova decisione
          </Link>
        </div>
      </div>

      {msg ? <div className="notice" style={{ marginTop: 14 }}>{msg}</div> : null}

      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div className="field">
            <div className="label">Filtro</div>
            <select className="select" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="aperto">Aperti</option>
              <option value="chiuso">Chiusi</option>
              <option value="tutti">Tutti</option>
            </select>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <span className="pill">
            Risultati: <b>{filtered.length}</b>
          </span>
          <span className="pill">
            Totale: <b>{all.length}</b>
          </span>
        </div>
      </div>

      <div className="list" style={{ marginTop: 14 }}>
        {filtered.length === 0 ? (
          <div className="notice">Nessun ticket in questo filtro.</div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="item">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>{t.riassunto}</div>
                <span className="tag">Stato: {t.stato}</span>
              </div>
              <div className="muted" style={{ marginTop: 8, lineHeight: 1.35 }}>
                {t.contesto}
              </div>
              <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                <span className="tag">{formatDateTime(t.createdAt)}</span>
                <span className="tag">Opzioni: {t.opzioni.length}</span>
                <span className="tag">Vincoli: {t.vincoli.length}</span>
              </div>
              <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                <button className="btn small" onClick={() => toggle(t)}>
                  Segna {t.stato === "aperto" ? "chiuso" : "aperto"}
                </button>
                {t.decisionId ? (
                  <Link className="btn small" href={`/log/${t.decisionId}`}>
                    Apri decisione
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

