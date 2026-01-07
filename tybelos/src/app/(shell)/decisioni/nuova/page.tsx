"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Constraint, ProposedOption, Rischio, Urgenza } from "@/lib/types";
import { listConstraints } from "@/lib/repository/constraintsRepo";
import { addDecision, updateDecision } from "@/lib/repository/decisionsRepo";
import { createTicket } from "@/lib/repository/ticketsRepo";
import { generateProposals, snapshotConstraints } from "@/lib/generator/proposalGenerator";
import { Badge, Button, Card, Hint, Input, Label, SectionTitle, Select, Textarea } from "@/app/_components/ui";

type Step = "contesto" | "proposta" | "scelta" | "esito";

async function predictScore(payload: unknown) {
  const res = await fetch("/api/predict", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { score?: number };
  return typeof data.score === "number" ? data.score : undefined;
}

export default function NuovaDecisionePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("contesto");

  const [categoria, setCategoria] = useState("");
  const [contesto, setContesto] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [urgenza, setUrgenza] = useState<Urgenza>("media");
  const [rischio, setRischio] = useState<Rischio>("medio");

  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [options, setOptions] = useState<ProposedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setConstraints(await listConstraints());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const selectedConstraints = useMemo(
    () => constraints.filter((c) => selected.has(c.id)),
    [constraints, selected]
  );

  const canGenerate = useMemo(() => {
    return contesto.trim().length >= 10 && obiettivo.trim().length >= 3;
  }, [contesto, obiettivo]);

  const onGenerate = async () => {
    if (!canGenerate) return;
    setBusy(true);
    setError(null);
    try {
      const { options: raw } = generateProposals({
        contesto,
        obiettivo,
        urgenza,
        rischio,
        constraints: selectedConstraints,
      });

      const withScores = await Promise.all(
        raw.map(async (o) => {
          const score = await predictScore({
            contesto,
            obiettivo,
            urgenza,
            rischio,
            vincoli: selectedConstraints.map((c) => ({
              kind: c.kind,
              nome: c.nome,
              valore: c.valore,
              unita: c.unita,
            })),
            opzione: { titolo: o.titolo, descrizione: o.descrizione },
          });
          return { ...o, score };
        })
      );

      setOptions(withScores);
      setStep("proposta");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nella generazione.");
    } finally {
      setBusy(false);
    }
  };

  const onEscalate = async () => {
    if (!options.length) return;
    await createTicket({
      contesto,
      obiettivo,
      opzioni: options.map((o) => ({ id: o.id, titolo: o.titolo })),
      vincoli: snapshotConstraints(selectedConstraints) ?? [],
    });
    router.push("/escalation");
  };

  const onChoose = async (opt: ProposedOption) => {
    setBusy(true);
    setError(null);
    try {
      const vincoliSnap = snapshotConstraints(selectedConstraints);
      const decision = await addDecision({
        categoria: categoria.trim() || undefined,
        contesto,
        obiettivo,
        urgenza,
        rischio,
        vincoliIds: Array.from(selected),
        vincoliSnapshot: vincoliSnap,
        opzioni: options,
      });

      // Register choice immediately
      await updateDecision(decision.id, {
        scelta: { optionId: opt.id, timestamp: Date.now() },
      });

      setStep("scelta");
      router.push(`/log/${decision.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel salvataggio.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Nuova decisione"
        subtitle="Inserisci contesto, obiettivo e vincoli. Tybelos propone 1–2 opzioni (deterministiche) e mostra una score finta via /api/predict."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={step === "contesto" ? "success" : "neutral"}>1 Contesto</Badge>
          <Badge tone={step === "proposta" ? "success" : "neutral"}>2 Proposta</Badge>
          <Badge tone={step === "scelta" ? "success" : "neutral"}>3 Scelta</Badge>
          <Badge tone={step === "esito" ? "success" : "neutral"}>4 Esito</Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Categoria (opzionale)</Label>
            <Input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Es. lavoro, salute, acquisti…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Obiettivo</Label>
            <Input
              value={obiettivo}
              onChange={(e) => setObiettivo(e.target.value)}
              placeholder="Cosa vuoi ottenere?"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Contesto</Label>
            <Textarea
              value={contesto}
              onChange={(e) => setContesto(e.target.value)}
              placeholder="Descrivi la situazione in 2–5 frasi (vincoli reali, persone coinvolte, tempi)."
            />
            <Hint>Tip: più contesto → proposte più sensate (anche se locali).</Hint>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Urgenza</Label>
            <Select value={urgenza} onChange={(e) => setUrgenza(e.target.value as Urgenza)}>
              <option value="bassa">Bassa</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Rischio</Label>
            <Select value={rischio} onChange={(e) => setRischio(e.target.value as Rischio)}>
              <option value="basso">Basso</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight">Vincoli</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {loading ? "Caricamento…" : `${selected.size} selezionati`}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {constraints.map((c) => {
            const checked = selected.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })
                }
                className={[
                  "flex min-h-14 items-start justify-between gap-3 rounded-3xl border px-4 py-4 text-left",
                  checked
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/40",
                ].join(" ")}
              >
                <div className="flex flex-col gap-1">
                  <div className="text-base font-semibold tracking-tight">
                    {c.nome}
                  </div>
                  {c.descrizione ? (
                    <div className="text-sm leading-6 opacity-90">
                      {c.descrizione}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {typeof c.valore === "number" ? (
                    <Badge tone="warn">
                      {c.valore}
                      {c.unita ? ` ${c.unita}` : ""}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">—</Badge>
                  )}
                  <Badge tone={checked ? "success" : "neutral"}>
                    {checked ? "Attivo" : "Off"}
                  </Badge>
                </div>
              </button>
            );
          })}

          {!constraints.length && !loading ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Nessun vincolo. Vai su “Vincoli” per crearne uno.
            </div>
          ) : null}
        </div>
      </Card>

      {error ? (
        <Card className="border-red-200 dark:border-red-900/40">
          <div className="text-base font-semibold text-red-700 dark:text-red-300">
            {error}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Button onClick={onGenerate} disabled={!canGenerate || busy}>
          Genera proposta (max 2 opzioni)
        </Button>
        <Hint>
          Richiede contesto (≥10 caratteri) e obiettivo (≥3). Le opzioni sono
          deterministiche e locali.
        </Hint>
      </div>

      {options.length ? (
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-lg font-semibold tracking-tight">
                Proposta
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Seleziona un’opzione. (Score finta: placeholder per AI predittiva)
              </div>
            </div>
            <Button variant="secondary" onClick={onEscalate}>
              Escalation (assistente umano)
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {options.map((o) => (
              <div
                key={o.id}
                className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-base font-semibold tracking-tight">
                      {o.titolo}
                    </div>
                    {o.descrizione ? (
                      <div className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {o.descrizione}
                      </div>
                    ) : null}
                  </div>
                  <Badge
                    tone={
                      typeof o.score === "number"
                        ? o.score >= 0.67
                          ? "success"
                          : o.score >= 0.34
                            ? "warn"
                            : "danger"
                        : "neutral"
                    }
                  >
                    {typeof o.score === "number" ? `score ${o.score.toFixed(3)}` : "score —"}
                  </Badge>
                </div>

                <div className="mt-4">
                  <Button className="w-full" onClick={() => onChoose(o)} disabled={busy}>
                    Scegli questa opzione
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

