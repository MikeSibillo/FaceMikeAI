import { getDb } from "@/lib/db";
import type { Constraint, ConstraintKind } from "@/lib/types";
import { createId } from "@/lib/utils/id";

export async function listConstraints() {
  const db = await getDb();
  const all = await db.getAllFromIndex("constraints", "by-updatedAt");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getConstraint(id: string) {
  const db = await getDb();
  return db.get("constraints", id);
}

export async function addConstraint(input: {
  nome: string;
  kind: ConstraintKind;
  valore?: number;
  unita?: string;
  descrizione?: string;
}) {
  const db = await getDb();
  const now = Date.now();
  const item: Constraint = {
    id: createId("c"),
    nome: input.nome.trim(),
    kind: input.kind,
    valore: input.valore,
    unita: input.unita,
    descrizione: input.descrizione?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.put("constraints", item);
  return item;
}

export async function updateConstraint(
  id: string,
  patch: Partial<Omit<Constraint, "id" | "createdAt">>
) {
  const db = await getDb();
  const current = await db.get("constraints", id);
  if (!current) return null;
  const updated: Constraint = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  await db.put("constraints", updated);
  return updated;
}

export async function deleteConstraint(id: string) {
  const db = await getDb();
  await db.delete("constraints", id);
}

export async function seedDefaultConstraintsIfEmpty() {
  const db = await getDb();
  const count = await db.count("constraints");
  if (count > 0) return;

  await addConstraint({
    nome: "Max 2 opzioni",
    kind: "max_options",
    valore: 2,
    unita: "opzioni",
    descrizione: "Riduci il carico: mostra al massimo 2 opzioni.",
  });
  await addConstraint({
    nome: "Cooldown 2 ore",
    kind: "cooldown_hours",
    valore: 2,
    unita: "ore",
    descrizione:
      "Evita cambi frequenti: dopo una scelta aspetta 2 ore prima di rivalutare.",
  });
  await addConstraint({
    nome: "Budget massimo",
    kind: "budget_max",
    valore: 50,
    unita: "€",
    descrizione: "Limite economico (placeholder).",
  });
}

