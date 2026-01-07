import { getDb } from "@/lib/db";
import type { Decision, ProposedOption, Rischio, Urgenza } from "@/lib/types";
import { createId } from "@/lib/utils/id";

export async function listDecisions() {
  const db = await getDb();
  const all = await db.getAllFromIndex("decisions", "by-createdAt");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getDecision(id: string) {
  const db = await getDb();
  return db.get("decisions", id);
}

export async function addDecision(input: {
  categoria?: string;
  contesto: string;
  obiettivo: string;
  urgenza: Urgenza;
  rischio: Rischio;
  vincoliIds: string[];
  vincoliSnapshot?: Decision["vincoliSnapshot"];
  opzioni: ProposedOption[];
}) {
  const db = await getDb();
  const now = Date.now();
  const item: Decision = {
    id: createId("d"),
    categoria: input.categoria?.trim() || undefined,
    contesto: input.contesto.trim(),
    obiettivo: input.obiettivo.trim(),
    urgenza: input.urgenza,
    rischio: input.rischio,
    vincoliIds: input.vincoliIds,
    vincoliSnapshot: input.vincoliSnapshot,
    opzioni: input.opzioni,
    esito: { stato: "sconosciuto" },
    createdAt: now,
    updatedAt: now,
  };
  await db.put("decisions", item);
  return item;
}

export async function updateDecision(
  id: string,
  patch: Partial<Omit<Decision, "id" | "createdAt">>
) {
  const db = await getDb();
  const current = await db.get("decisions", id);
  if (!current) return null;
  const updated: Decision = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  await db.put("decisions", updated);
  return updated;
}

export async function deleteDecision(id: string) {
  const db = await getDb();
  await db.delete("decisions", id);
}

