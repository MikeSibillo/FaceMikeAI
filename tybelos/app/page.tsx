"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Decisione } from "@/lib/types";
import { listDecisioni } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";

export default function HomePage() {
  const [recent, setRecent] = useState<Decisione[]>([]);

  useEffect(() => {
    listDecisioni()
      .then((all) => setRecent(all.slice(0, 5)))
      .catch(() => setRecent([]));
  }, []);

  const kpi = useMemo(() => {
    const total = recent.length;
    const completed = recent.filter((d) => d.esito && d.esito.valore !== "sconosciuto").length;
    return { total, completed };
  }, [recent]);

  return (
    <div className="container">
      <div className="card" style={{ padding: 18 }}>
        <h1 className="title">Decision OS, senza rumore.</h1>
        <p className="subtitle">
          Tybelos guida il flusso <b>Contesto → Proposta → Scelta → Esito</b> e costruisce memoria decisionale nel tempo.
        </p>
        <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
          <Link className="btn primary" href="/new">
            Nuova decisione
          </Link>
          <Link className="btn" href="/log">
            Apri log
          </Link>
          <span className="pill">Max 1–2 opzioni per volta</span>
          <span className="pill">Storage locale (offline)</span>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="h2">Contesto → Proposta → Scelta → Esito</div>
              <div className="subtitle">Riduci il carico: prima chiarisci, poi scegli tra poche opzioni.</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="kpi">{kpi.completed}</div>
              <div className="subtitle">decisioni con esito</div>
            </div>
          </div>
          <hr className="hr" />
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div className="item">
              <div style={{ fontWeight: 800 }}>1) Contesto</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Cosa sta succedendo? Qual è l’obiettivo? Quali vincoli non si toccano?
              </div>
            </div>
            <div className="item">
              <div style={{ fontWeight: 800 }}>2) Proposta</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Genera 1–2 opzioni deterministiche, coerenti con urgenza, rischio e vincoli.
              </div>
            </div>
            <div className="item">
              <div style={{ fontWeight: 800 }}>3) Scelta</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Scegli una sola opzione. Se serve, usa “Escalation” (assistente umano).
              </div>
            </div>
            <div className="item">
              <div style={{ fontWeight: 800 }}>4) Esito</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Registra come è andata: Tybelos costruisce memoria e coerenza.
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="h2">Ultime decisioni</div>
              <div className="subtitle">Locale, offline, pronte da rivedere.</div>
            </div>
            <Link className="btn small" href="/log">
              Vedi tutto
            </Link>
          </div>
          <div className="list" style={{ marginTop: 12 }}>
            {recent.length === 0 ? (
              <div className="notice">Nessuna decisione ancora. Inizia con “Nuova decisione”.</div>
            ) : (
              recent.map((d) => (
                <Link key={d.id} href={`/log/${d.id}`} className="item">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontWeight: 800 }}>{d.obiettivo || "Decisione"}</div>
                    <span className="tag">{formatDateTime(d.createdAt)}</span>
                  </div>
                  <div className="muted" style={{ marginTop: 6, lineHeight: 1.35 }}>
                    {d.contesto}
                  </div>
                  <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                    <span className="tag">Urgenza: {d.urgenza}</span>
                    <span className="tag">Rischio: {d.rischio}</span>
                    <span className="tag">Esito: {d.esito?.valore ?? "sconosciuto"}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

