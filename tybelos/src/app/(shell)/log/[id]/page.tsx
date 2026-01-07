"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Constraint, Decision, Esito, ProposedOption } from "@/lib/types";
import { getDecision, updateDecision, deleteDecision } from "@/lib/repository/decisionsRepo";
import { listConstraints } from "@/lib/repository/constraintsRepo";
import { createTicket } from "@/lib/repository/ticketsRepo";
import { Badge, Button, Card, Hint, Label, SectionTitle, Select, Textarea } from "@/app/_components/ui";
import { formatDateTime } from "@/lib/utils/date";

function toneForStato(stato: string) {
  if (stato === "positivo") return "success";
  if (stato === "negativo") return "danger";
  if (stato === "neutro") return "warn";
  return "neutral";
}

export default function LogDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [decision, setDecision] = useState<Decision | null>(null);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [esitoStato, setEsitoStato] = useState<Esito["stato"]>("sconosciuto");
  const [nota, setNota] = useState<string>("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await getDecision(id);
      setDecision(d ?? null);
      setEsitoStato(d?.esito?.stato ?? "sconosciuto");
      setNota(d?.esito?.nota ?? "");
      setConstraints(await listConstraints());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const vincoli = useMemo(() => {
    if (!decision) return [];
    if (decision.vincoliSnapshot?.length) return decision.vincoliSnapshot;
    const byId = new Map(constraints.map((c) => [c.id, c] as const));
    return decision.vincoliIds
      .map((cid) => byId.get(cid))
      .filter(Boolean)
      .map((c) => ({
        id: c!.id,
        nome: c!.nome,
        kind: c!.kind,
        valore: c!.valore,
        unita: c!.unita,
      }));
  }, [decision, constraints]);

  const sceltaTitolo = useMemo(() => {
    if (!decision?.scelta) return null;
    return decision.opzioni.find((o) => o.id === decision.scelta?.optionId)?.titolo ?? null;
  }, [decision]);

  const saveEsito = async () => {
    if (!decision) return;
    setSaving(true);
    try {
      const updated = await updateDecision(decision.id, {
        esito: {
          stato: esitoStato,
          nota: nota.trim() || undefined,
          timestamp: Date.now(),
        },
      });
      if (updated) {
        setDecision(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const setChoice = async (opt: ProposedOption) => {
    if (!decision) return;
    setSaving(true);
    try {
      const updated = await updateDecision(decision.id, {
        scelta: { optionId: opt.id, timestamp: Date.now() },
      });
      if (updated) setDecision(updated);
    } finally {
      setSaving(false);
    }
  };

  const onEscalate = async () => {
    if (!decision) return;
    await createTicket({
      contesto: decision.contesto,
      obiettivo: decision.obiettivo,
      opzioni: decision.opzioni.map((o) => ({ id: o.id, titolo: o.titolo })),
      vincoli: vincoli,
    });
    router.push("/escalation");
  };

  const onDelete = async () => {
    if (!decision) return;
    await deleteDecision(decision.id);
    router.push("/log");
  };

  if (loading) {
    return (
      <Card>
        <div className="text-base font-semibold tracking-tight">Caricamento…</div>
      </Card>
    );
  }

  if (!decision) {
    return (
      <Card>
        <div className="text-base font-semibold tracking-tight">Non trovato</div>
        <div className="mt-3">
          <Link href="/log">
            <Button variant="secondary">Torna al log</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const stato = decision.esito?.stato ?? "sconosciuto";

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Dettaglio decisione" subtitle="Rivedi contesto, opzioni, scelta ed esito. Se serve, crea un ticket per un assistente umano." />

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xl font-semibold tracking-tight">
                {decision.obiettivo}
              </div>
              {decision.categoria ? <Badge tone="neutral">{decision.categoria}</Badge> : null}
              <Badge tone={toneForStato(stato)}>{stato}</Badge>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Creato: {formatDateTime(decision.createdAt)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Urgenza: {decision.urgenza}</Badge>
            <Badge tone="neutral">Rischio: {decision.rischio}</Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Contesto</Label>
            <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-6 dark:bg-zinc-900/40">
              {decision.contesto}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Vincoli</Label>
            <div className="flex flex-wrap gap-2 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/40">
              {vincoli.length ? (
                vincoli.map((v) => (
                  <Badge key={v.id} tone="neutral">
                    {v.nome}
                    {typeof v.valore === "number"
                      ? ` · ${v.valore}${v.unita ? ` ${v.unita}` : ""}`
                      : ""}
                  </Badge>
                ))
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">—</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight">Opzioni (max 2)</div>
          <Button variant="secondary" onClick={onEscalate}>
            Escalation (assistente umano)
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {decision.opzioni.map((o) => {
            const selected = decision.scelta?.optionId === o.id;
            return (
              <div
                key={o.id}
                className={[
                  "rounded-3xl border p-4",
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-base font-semibold tracking-tight">
                      {o.titolo}
                    </div>
                    {o.descrizione ? (
                      <div className="text-sm leading-6 opacity-90">
                        {o.descrizione}
                      </div>
                    ) : null}
                  </div>

                  {typeof o.score === "number" ? (
                    <Badge tone={o.score >= 0.67 ? "success" : o.score >= 0.34 ? "warn" : "danger"}>
                      score {o.score.toFixed(3)}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">score —</Badge>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {!selected ? (
                    <Button
                      onClick={() => setChoice(o)}
                      disabled={saving}
                      className="w-full"
                    >
                      Scegli
                    </Button>
                  ) : (
                    <div className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-white/15 text-sm font-semibold dark:bg-zinc-950/20">
                      Selezionata
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Hint>
            Scelta attuale:{" "}
            <span className="font-semibold">
              {sceltaTitolo ?? "— (non ancora registrata)"}
            </span>
          </Hint>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight">Esito</div>
          <Button onClick={saveEsito} disabled={saving}>
            Salva esito
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Stato</Label>
            <Select
              value={esitoStato}
              onChange={(e) => setEsitoStato(e.target.value as Esito["stato"])}
            >
              <option value="sconosciuto">Sconosciuto</option>
              <option value="positivo">Positivo</option>
              <option value="neutro">Neutro</option>
              <option value="negativo">Negativo</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Nota (opzionale)</Label>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="border-red-200 dark:border-red-900/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-base font-semibold tracking-tight">
              Azioni pericolose
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Elimina definitivamente questa decisione.
            </div>
          </div>
          <Button variant="danger" onClick={onDelete}>
            Elimina decisione
          </Button>
        </div>
      </Card>
    </div>
  );
}

