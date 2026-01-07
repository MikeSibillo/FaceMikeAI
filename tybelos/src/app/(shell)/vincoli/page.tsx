"use client";

import { useEffect, useMemo, useState } from "react";
import type { Constraint, ConstraintKind } from "@/lib/types";
import {
  addConstraint,
  deleteConstraint,
  listConstraints,
  updateConstraint,
} from "@/lib/repository/constraintsRepo";
import { Badge, Button, Card, Hint, Input, Label, Select, Textarea } from "@/app/_components/ui";

const kindLabel: Record<ConstraintKind, string> = {
  max_options: "Max opzioni",
  cooldown_hours: "Cooldown (ore)",
  budget_max: "Budget massimo",
  custom: "Custom",
};

export default function VincoliPage() {
  const [items, setItems] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [kind, setKind] = useState<ConstraintKind>("custom");
  const [valore, setValore] = useState<string>("");
  const [unita, setUnita] = useState<string>("");
  const [descrizione, setDescrizione] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPatch, setEditPatch] = useState<Partial<Constraint>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listConstraints();
      setItems(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const canAdd = useMemo(() => nome.trim().length > 0, [nome]);

  const onAdd = async () => {
    if (!canAdd) return;
    await addConstraint({
      nome,
      kind,
      valore: valore.trim() ? Number(valore) : undefined,
      unita: unita.trim() || undefined,
      descrizione: descrizione.trim() || undefined,
    });
    setNome("");
    setKind("custom");
    setValore("");
    setUnita("");
    setDescrizione("");
    await load();
  };

  const startEdit = (c: Constraint) => {
    setEditingId(c.id);
    setEditPatch({ ...c });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const patch: Partial<Constraint> = {
      nome: editPatch.nome?.trim() || "",
      kind: editPatch.kind,
      valore: typeof editPatch.valore === "number" ? editPatch.valore : undefined,
      unita: editPatch.unita?.trim() || undefined,
      descrizione: editPatch.descrizione?.trim() || undefined,
    };
    await updateConstraint(editingId, patch);
    setEditingId(null);
    setEditPatch({});
    await load();
  };

  const remove = async (id: string) => {
    await deleteConstraint(id);
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Vincoli
        </h1>
        <p className="max-w-3xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
          I vincoli guidano la generazione delle proposte e mantengono coerenza
          nel tempo (es. “max 2 opzioni”, “cooldown 2 ore”, “budget max”).
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight">Nuovo vincolo</div>
          <Badge tone="neutral">CRUD</Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es. Max 2 opzioni"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={kind} onChange={(e) => setKind(e.target.value as ConstraintKind)}>
              <option value="max_options">Max opzioni</option>
              <option value="cooldown_hours">Cooldown (ore)</option>
              <option value="budget_max">Budget massimo</option>
              <option value="custom">Custom</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Valore (opzionale)</Label>
            <Input
              value={valore}
              onChange={(e) => setValore(e.target.value)}
              inputMode="numeric"
              placeholder="Es. 2"
            />
            <Hint>Per “max opzioni” e “cooldown” è consigliato.</Hint>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Unità (opzionale)</Label>
            <Input
              value={unita}
              onChange={(e) => setUnita(e.target.value)}
              placeholder="Es. ore, €, opzioni"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Descrizione (opzionale)</Label>
            <Textarea
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Perché esiste questo vincolo?"
            />
          </div>

          <div className="md:col-span-2">
            <Button onClick={onAdd} disabled={!canAdd}>
              Aggiungi vincolo
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="text-lg font-semibold tracking-tight">Elenco</div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {loading ? "Caricamento…" : `${items.length} vincoli`}
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 dark:border-red-900/40">
          <div className="text-base font-semibold text-red-700 dark:text-red-300">
            {error}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {items.map((c) => {
          const isEditing = editingId === c.id;
          return (
            <Card key={c.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold tracking-tight">
                      {c.nome}
                    </div>
                    <Badge tone="neutral">{kindLabel[c.kind]}</Badge>
                    {typeof c.valore === "number" ? (
                      <Badge tone="warn">
                        {c.valore}
                        {c.unita ? ` ${c.unita}` : ""}
                      </Badge>
                    ) : null}
                  </div>
                  {c.descrizione ? (
                    <div className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {c.descrizione}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="secondary" onClick={() => startEdit(c)}>
                        Modifica
                      </Button>
                      <Button variant="danger" onClick={() => remove(c.id)}>
                        Elimina
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={saveEdit}>Salva</Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditPatch({});
                        }}
                      >
                        Annulla
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Nome</Label>
                    <Input
                      value={String(editPatch.nome ?? "")}
                      onChange={(e) =>
                        setEditPatch((p) => ({ ...p, nome: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={String(editPatch.kind ?? "custom")}
                      onChange={(e) =>
                        setEditPatch((p) => ({
                          ...p,
                          kind: e.target.value as ConstraintKind,
                        }))
                      }
                    >
                      <option value="max_options">Max opzioni</option>
                      <option value="cooldown_hours">Cooldown (ore)</option>
                      <option value="budget_max">Budget massimo</option>
                      <option value="custom">Custom</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Valore</Label>
                    <Input
                      value={
                        typeof editPatch.valore === "number"
                          ? String(editPatch.valore)
                          : ""
                      }
                      onChange={(e) =>
                        setEditPatch((p) => ({
                          ...p,
                          valore: e.target.value.trim()
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Unità</Label>
                    <Input
                      value={String(editPatch.unita ?? "")}
                      onChange={(e) =>
                        setEditPatch((p) => ({ ...p, unita: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Descrizione</Label>
                    <Textarea
                      value={String(editPatch.descrizione ?? "")}
                      onChange={(e) =>
                        setEditPatch((p) => ({
                          ...p,
                          descrizione: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

