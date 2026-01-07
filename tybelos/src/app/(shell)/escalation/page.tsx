"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ticket } from "@/lib/types";
import { deleteTicket, listTickets, updateTicket } from "@/lib/repository/ticketsRepo";
import { Badge, Button, Card, Label, SectionTitle, Select, Textarea } from "@/app/_components/ui";
import { formatDateTime } from "@/lib/utils/date";

export default function EscalationPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTickets(await listTickets());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return tickets;
    return tickets.filter((t) => t.stato === filter);
  }, [tickets, filter]);

  const selected = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId]
  );

  const toggle = async (t: Ticket) => {
    await updateTicket(t.id, { stato: t.stato === "aperto" ? "chiuso" : "aperto" });
    await load();
  };

  const remove = async (t: Ticket) => {
    await deleteTicket(t.id);
    setSelectedId(null);
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Assistente umano (Escalation)"
        subtitle="Quando Tybelos non basta, crea un ticket locale con riassunto (contesto, opzioni, vincoli) e stato aperto/chiuso."
      />

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>Filtro stato</Label>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Tutti</option>
              <option value="aperto">Aperti</option>
              <option value="chiuso">Chiusi</option>
            </Select>
          </div>
          <div className="md:col-span-2 flex items-end justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <div>{loading ? "Caricamento…" : `${filtered.length} ticket`}</div>
            <Button variant="secondary" onClick={load}>
              Aggiorna
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={[
                "rounded-3xl border p-4 text-left transition",
                selectedId === t.id
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/40",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-base font-semibold tracking-tight">
                    {t.obiettivo}
                  </div>
                  <div className="text-sm opacity-80">{formatDateTime(t.createdAt)}</div>
                </div>
                <Badge tone={t.stato === "aperto" ? "warn" : "neutral"}>{t.stato}</Badge>
              </div>
              <div className="mt-2 text-sm leading-6 opacity-90 whitespace-pre-wrap">
                {t.riassunto}
              </div>
            </button>
          ))}

          {!loading && filtered.length === 0 ? (
            <Card>
              <div className="text-base font-semibold tracking-tight">
                Nessun ticket
              </div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Crea un ticket dalla schermata “Nuova decisione” o dal dettaglio del log.
              </div>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {selected ? (
            <Card>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold tracking-tight">
                    Dettaglio ticket
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(selected.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => toggle(selected)}>
                    {selected.stato === "aperto" ? "Chiudi" : "Riapri"}
                  </Button>
                  <Button variant="danger" onClick={() => remove(selected)}>
                    Elimina
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Contesto</Label>
                  <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-6 dark:bg-zinc-900/40">
                    {selected.contesto}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Riassunto</Label>
                  <Textarea value={selected.riassunto} readOnly />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Opzioni</Label>
                  <div className="flex flex-wrap gap-2">
                    {selected.opzioni.map((o) => (
                      <Badge key={o.id} tone="neutral">
                        {o.titolo}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Vincoli</Label>
                  <div className="flex flex-wrap gap-2">
                    {selected.vincoli.map((v) => (
                      <Badge key={v.id} tone="neutral">
                        {v.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-base font-semibold tracking-tight">
                Seleziona un ticket
              </div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Tocca un elemento a sinistra per vedere i dettagli.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

