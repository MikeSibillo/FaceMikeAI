import { getDb } from "@/lib/db";
import type { Constraint, ProposedOption, Ticket } from "@/lib/types";
import { createId } from "@/lib/utils/id";

export async function listTickets() {
  const db = await getDb();
  const all = await db.getAllFromIndex("tickets", "by-updatedAt");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getTicket(id: string) {
  const db = await getDb();
  return db.get("tickets", id);
}

export async function createTicket(input: {
  contesto: string;
  obiettivo: string;
  opzioni: Pick<ProposedOption, "id" | "titolo">[];
  vincoli: Pick<Constraint, "id" | "nome" | "kind" | "valore" | "unita">[];
}) {
  const db = await getDb();
  const now = Date.now();
  const riassunto = [
    `Obiettivo: ${input.obiettivo}`,
    `Opzioni: ${input.opzioni.map((o) => o.titolo).join(" | ") || "—"}`,
    `Vincoli: ${input.vincoli.map((v) => v.nome).join(" | ") || "—"}`,
  ].join("\n");

  const ticket: Ticket = {
    id: createId("t"),
    stato: "aperto",
    riassunto,
    contesto: input.contesto,
    obiettivo: input.obiettivo,
    opzioni: input.opzioni,
    vincoli: input.vincoli,
    createdAt: now,
    updatedAt: now,
  };
  await db.put("tickets", ticket);
  return ticket;
}

export async function updateTicket(
  id: string,
  patch: Partial<Omit<Ticket, "id" | "createdAt">>
) {
  const db = await getDb();
  const current = await db.get("tickets", id);
  if (!current) return null;
  const updated: Ticket = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  await db.put("tickets", updated);
  return updated;
}

export async function deleteTicket(id: string) {
  const db = await getDb();
  await db.delete("tickets", id);
}

