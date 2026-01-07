"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Decision } from "@/lib/types";
import { listDecisions } from "@/lib/repository/decisionsRepo";
import { Badge, Button, Card, Input, Label, SectionTitle, Select } from "@/app/_components/ui";
import { formatDateTime } from "@/lib/utils/date";

type StatoEsito = NonNullable<Decision["esito"]>["stato"];

function esitoTone(stato: StatoEsito) {
  if (stato === "positivo") return "success";
  if (stato === "negativo") return "danger";
  if (stato === "neutro") return "warn";
  return "neutral";
}

export default function LogPage() {
  const [all, setAll] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoria, setCategoria] = useState<string>("");
  const [esito, setEsito] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const load = async () => {
    setLoading(true);
    try {
      setAll(await listDecisions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const categorie = useMemo(() => {
    const set = new Set<string>();
    for (const d of all) if (d.categoria) set.add(d.categoria);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [all]);

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;
    return all.filter((d) => {
      if (categoria && (d.categoria ?? "") !== categoria) return false;
      if (esito && (d.esito?.stato ?? "sconosciuto") !== esito) return false;
      if (fromTs && d.createdAt < fromTs) return false;
      if (toTs && d.createdAt > toTs) return false;
      return true;
    });
  }, [all, categoria, esito, from, to]);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Log decisionale"
        subtitle="Lista delle decisioni con filtri per categoria, data ed esito. Apri un elemento per vedere dettagli e registrare l’esito."
      />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight">Filtri</div>
          <Button
            variant="secondary"
            onClick={() => {
              setCategoria("");
              setEsito("");
              setFrom("");
              setTo("");
            }}
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Categoria</Label>
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Tutte</option>
              {categorie.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Esito</Label>
            <Select value={esito} onChange={(e) => setEsito(e.target.value)}>
              <option value="">Tutti</option>
              <option value="sconosciuto">Sconosciuto</option>
              <option value="positivo">Positivo</option>
              <option value="neutro">Neutro</option>
              <option value="negativo">Negativo</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Da</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>A</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="text-lg font-semibold tracking-tight">Decisioni</div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {loading ? "Caricamento…" : `${filtered.length} / ${all.length}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((d) => {
          const stato = d.esito?.stato ?? "sconosciuto";
          const scelta = d.scelta
            ? d.opzioni.find((o) => o.id === d.scelta?.optionId)?.titolo ?? "—"
            : "—";
          return (
            <Link key={d.id} href={`/log/${d.id}`} className="block">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold tracking-tight">
                        {d.obiettivo}
                      </div>
                      {d.categoria ? <Badge tone="neutral">{d.categoria}</Badge> : null}
                      <Badge tone={esitoTone(stato)}>{stato}</Badge>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDateTime(d.createdAt)}
                    </div>
                    <div className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold">Scelta:</span> {scelta}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">Urgenza: {d.urgenza}</Badge>
                    <Badge tone="neutral">Rischio: {d.rischio}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}

        {!loading && filtered.length === 0 ? (
          <Card>
            <div className="text-base font-semibold tracking-tight">
              Nessun risultato
            </div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Prova a rimuovere i filtri o crea una nuova decisione.
            </div>
            <div className="mt-4">
              <Link href="/decisioni/nuova">
                <Button>Nuova decisione</Button>
              </Link>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

