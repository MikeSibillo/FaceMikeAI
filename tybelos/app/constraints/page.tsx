"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConstraintType, Vincolo } from "@/lib/types";
import { deleteVincolo, listVincoli, saveVincolo } from "@/lib/repo";

const TYPE_LABEL: Record<ConstraintType, string> = {
  max_options: "Max opzioni (cap a 2)",
  cooldown_hours: "Cooldown (ore)",
  budget_max: "Budget max",
  testo: "Testo libero"
};

export default function ConstraintsPage() {
  const [items, setItems] = useState<Vincolo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [type, setType] = useState<ConstraintType>("testo");
  const [nome, setNome] = useState("");
  const [valore, setValore] = useState("");
  const [msg, setMsg] = useState("");

  async function refresh() {
    const v = await listVincoli();
    setItems(v);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const editing = useMemo(() => items.find((x) => x.id === editingId) ?? null, [items, editingId]);

  useEffect(() => {
    if (!editing) return;
    setType(editing.type);
    setNome(editing.nome);
    setValore(editing.valore);
  }, [editing]);

  function resetForm() {
    setEditingId(null);
    setType("testo");
    setNome("");
    setValore("");
  }

  async function onSave() {
    setMsg("");
    if (nome.trim().length === 0) {
      setMsg("Nome obbligatorio.");
      return;
    }
    if (valore.trim().length === 0) {
      setMsg("Valore obbligatorio.");
      return;
    }
    try {
      await saveVincolo({
        id: editing?.id,
        createdAt: editing?.createdAt,
        type,
        nome: nome.trim(),
        valore: valore.trim()
      });
      await refresh();
      setMsg(editing ? "Vincolo aggiornato." : "Vincolo creato.");
      resetForm();
    } catch {
      setMsg("Errore salvataggio vincolo.");
    }
  }

  async function onDelete(id: string) {
    setMsg("");
    try {
      await deleteVincolo(id);
      await refresh();
      if (editingId === id) resetForm();
      setMsg("Vincolo eliminato.");
    } catch {
      setMsg("Errore eliminazione vincolo.");
    }
  }

  return (
    <div className="container">
      <div>
        <h1 className="title" style={{ marginBottom: 4 }}>
          Vincoli
        </h1>
        <p className="subtitle">CRUD vincoli che guidano il generatore (max 2 opzioni, cooldown, budget…).</p>
      </div>

      {msg ? <div className="notice" style={{ marginTop: 14 }}>{msg}</div> : null}

      <div className="split" style={{ marginTop: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="h2">Lista vincoli</div>
            <button className="btn small" onClick={() => resetForm()}>
              Nuovo
            </button>
          </div>
          <div className="list" style={{ marginTop: 12 }}>
            {items.length === 0 ? (
              <div className="notice">Nessun vincolo. Creane uno a destra.</div>
            ) : (
              items.map((v) => (
                <div key={v.id} className="item">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>{v.nome}</div>
                    <span className="tag">{TYPE_LABEL[v.type]}</span>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    Valore: <b>{v.valore}</b>
                  </div>
                  <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                    <button className="btn small" onClick={() => setEditingId(v.id)}>
                      Modifica
                    </button>
                    <button className="btn small danger" onClick={() => onDelete(v.id)}>
                      Elimina
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="h2">{editing ? "Modifica vincolo" : "Nuovo vincolo"}</div>
          <p className="subtitle">Suggerimenti: max_options=2, cooldown_hours=2, budget_max=100€.</p>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">Tipo</div>
              <select className="select" value={type} onChange={(e) => setType(e.target.value as ConstraintType)}>
                <option value="max_options">max_options</option>
                <option value="cooldown_hours">cooldown_hours</option>
                <option value="budget_max">budget_max</option>
                <option value="testo">testo</option>
              </select>
            </div>
            <div className="field">
              <div className="label">Nome</div>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Max 2 opzioni" />
            </div>
            <div className="field">
              <div className="label">Valore</div>
              <input className="input" value={valore} onChange={(e) => setValore(e.target.value)} placeholder="Es. 2 / 2 ore / 100€ / testo…" />
            </div>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <button className="btn primary" onClick={onSave}>
                Salva
              </button>
              {editing ? (
                <button className="btn" onClick={() => resetForm()}>
                  Annulla
                </button>
              ) : null}
            </div>
          </div>

          <hr className="hr" />

          <div className="notice">
            Nota: il generatore rispetta sempre <b>max 2 opzioni</b> anche se imposti un valore maggiore.
          </div>
        </div>
      </div>
    </div>
  );
}

