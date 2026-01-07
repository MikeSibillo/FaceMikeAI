import { deleteItem, getAllItems, getItem, putItem } from "@/lib/idb";
import type { Decisione, TicketEscalation, Vincolo } from "@/lib/types";

function now() {
  return Date.now();
}

function newId(prefix: string) {
  // Prefer crypto.randomUUID; fallback keeps it short + unique enough for local-only.
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${uuid}`;
}

export async function ensureSeedData(): Promise<void> {
  const existing = await listVincoli();
  if (existing.length > 0) return;

  const t = now();
  const seed: Vincolo = {
    id: newId("vincolo"),
    createdAt: t,
    updatedAt: t,
    type: "max_options",
    nome: "Max 2 opzioni",
    valore: "2"
  };
  await saveVincolo(seed);
}

// Decisions
export async function saveDecisione(
  d: Omit<Decisione, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Decisione, "id" | "createdAt">>
): Promise<Decisione> {
  const t = now();
  const id = d.id ?? newId("dec");
  const createdAt = d.createdAt ?? t;
  const full: Decisione = {
    ...d,
    id,
    createdAt,
    updatedAt: t
  } as Decisione;
  await putItem("decisions", full);
  return full;
}

export async function getDecisione(id: string): Promise<Decisione | undefined> {
  return await getItem("decisions", id);
}

export async function listDecisioni(): Promise<Decisione[]> {
  const all = await getAllItems("decisions");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

// Constraints
export async function saveVincolo(
  v: Omit<Vincolo, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Vincolo, "id" | "createdAt">>
): Promise<Vincolo> {
  const t = now();
  const id = v.id ?? newId("vincolo");
  const createdAt = v.createdAt ?? t;
  const full: Vincolo = {
    ...v,
    id,
    createdAt,
    updatedAt: t
  } as Vincolo;
  await putItem("constraints", full);
  return full;
}

export async function deleteVincolo(id: string): Promise<void> {
  await deleteItem("constraints", id);
}

export async function listVincoli(): Promise<Vincolo[]> {
  const all = await getAllItems("constraints");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

// Tickets
export async function createTicketEscalation(input: {
  decisionId?: string;
  riassunto: string;
  contesto: string;
  obiettivo: string;
  vincoli: Vincolo[];
  opzioni: TicketEscalation["opzioni"];
}): Promise<TicketEscalation> {
  const t = now();
  const ticket: TicketEscalation = {
    id: newId("ticket"),
    createdAt: t,
    updatedAt: t,
    stato: "aperto",
    decisionId: input.decisionId,
    riassunto: input.riassunto,
    contesto: input.contesto,
    obiettivo: input.obiettivo,
    vincoli: input.vincoli,
    opzioni: input.opzioni
  };
  await putItem("tickets", ticket);
  return ticket;
}

export async function setTicketStato(id: string, stato: TicketEscalation["stato"]): Promise<TicketEscalation> {
  const existing = await getItem("tickets", id);
  if (!existing) throw new Error("Ticket non trovato.");
  const updated: TicketEscalation = { ...existing, stato, updatedAt: now() };
  await putItem("tickets", updated);
  return updated;
}

export async function listTickets(): Promise<TicketEscalation[]> {
  const all = await getAllItems("tickets");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

