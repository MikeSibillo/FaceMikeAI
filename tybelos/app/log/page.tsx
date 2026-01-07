"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Decisione, EsitoValore } from "@/lib/types";
import { listDecisioni } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";

type DateFilter = "tutte" | "oggi" | "7g" | "30g";

function within(ts: number, filter: DateFilter) {
  const now = Date.now();
  if (filter === "tutte") return true;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (filter === "oggi") return ts >= startOfToday.getTime();
  const days = filter === "7g" ? 7 : 30;
  return ts >= now - days * 24 * 60 * 60 * 1000;
}

export default function LogPage() {
  const [all, setAll] = useState<Decisione[]>([]);
  const [categoria, setCategoria] = useState<string>("tutte");
  const [data, setData] = useState<DateFilter>("30g");
  const [esito, setEsito] = useState<EsitoValore | "tutti">("tutti");

  useEffect(() => {
    listDecisioni()
      .then(setAll)
      .catch(() => setAll([]));
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const d of all) if (d.categoria?.trim()) s.add(d.categoria.trim());
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter((d) => {
      if (categoria !== "tutte" && (d.categoria ?? "") !== categoria) return false;
      if (!within(d.createdAt, data)) return false;
      if (esito !== "tutti" && (d.esito?.valore ?? "sconosciuto") !== esito) return false;
      return true;
    });
  }, [all, categoria, data, esito]);

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <h1 className="title" style={{ marginBottom: 4 }}>
            Log decisionale
          </h1>
          <p className="subtitle">Filtra e rivedi: coerenza e memoria decisionale.</p>
        </div>
        <Link className="btn primary" href="/new">
          Nuova decisione
        </Link>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", alignItems: "end" }}>
          <div className="field">
            <div className="label">Categoria</div>
            <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="tutte">Tutte</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <div className="label">Data</div>
            <select className="select" value={data} onChange={(e) => setData(e.target.value as DateFilter)}>
              <option value="tutte">Tutte</option>
              <option value="oggi">Oggi</option>
              <option value="7g">Ultimi 7 giorni</option>
              <option value="30g">Ultimi 30 giorni</option>
            </select>
          </div>
          <div className="field">
            <div className="label">Esito</div>
            <select className="select" value={esito} onChange={(e) => setEsito(e.target.value as EsitoValore | "tutti")}>
              <option value="tutti">Tutti</option>
              <option value="positivo">Positivo</option>
              <option value="neutro">Neutro</option>
              <option value="negativo">Negativo</option>
              <option value="sconosciuto">Sconosciuto</option>
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
          <div className="notice">Nessuna decisione corrisponde ai filtri.</div>
        ) : (
          filtered.map((d) => (
            <Link key={d.id} href={`/log/${d.id}`} className="item">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{d.obiettivo || "Decisione"}</div>
                <span className="tag">{formatDateTime(d.createdAt)}</span>
              </div>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.35 }}>
                {d.contesto}
              </div>
              <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                {d.categoria ? <span className="tag">Categoria: {d.categoria}</span> : null}
                <span className="tag">Urgenza: {d.urgenza}</span>
                <span className="tag">Rischio: {d.rischio}</span>
                <span className="tag">Esito: {d.esito?.valore ?? "sconosciuto"}</span>
                {typeof d.score === "number" ? <span className="tag">Score: {Math.round(d.score * 100)}/100</span> : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

