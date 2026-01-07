import type { Constraint, Decision, ProposedOption, Rischio, Urgenza } from "@/lib/types";
import { fnv1a } from "@/lib/utils/hash";
import { createId } from "@/lib/utils/id";

function getMaxOptions(constraints: Constraint[]) {
  const max = constraints
    .filter((c) => c.kind === "max_options" && typeof c.valore === "number")
    .map((c) => c.valore as number)
    .sort((a, b) => a - b)[0];
  if (!max || !Number.isFinite(max)) return 2;
  return Math.min(2, Math.max(1, Math.round(max)));
}

function pickDistinct<T>(arr: T[], seed: number, n: number) {
  if (arr.length <= n) return arr.slice(0, n);
  const picked: T[] = [];
  let h = seed;
  while (picked.length < n) {
    const idx = h % arr.length;
    const cand = arr[idx];
    if (!picked.includes(cand)) picked.push(cand);
    h = fnv1a(String(h) + "::next");
  }
  return picked;
}

function optionTemplates(args: {
  obiettivo: string;
  urgenza: Urgenza;
  rischio: Rischio;
  constraints: Constraint[];
}) {
  const { obiettivo, urgenza, rischio, constraints } = args;
  const cooldown = constraints.find((c) => c.kind === "cooldown_hours" && c.valore);
  const budget = constraints.find((c) => c.kind === "budget_max" && c.valore);

  const budgetLine =
    budget && budget.valore
      ? `Mantieni il costo ≤ ${budget.valore}${budget.unita ?? ""}.`
      : undefined;

  const base = [
    {
      titolo: "Azione minima oggi",
      descrizione: `Fai il passo minimo che riduce l’incertezza verso “${obiettivo}”. Definisci un micro‑task da 15–30 minuti.`,
    },
    {
      titolo: "Esperimento rapido",
      descrizione:
        "Scegli un esperimento piccolo con metrica chiara. Se funziona, scala; se no, interrompi.",
    },
    {
      titolo: "Opzione prudente",
      descrizione:
        "Riduci variabili e rischi: prepara un piano breve + una via di uscita. Esegui solo dopo una verifica essenziale.",
    },
    {
      titolo: "Opzione aggressiva",
      descrizione:
        "Punta alla velocità: scegli il percorso più diretto e accetta trade‑off espliciti. Definisci un criterio di stop.",
    },
    {
      titolo: "Delegare / chiedere feedback",
      descrizione:
        "Coinvolgi una persona chiave con una domanda specifica. Limita il tempo e definisci cosa cambia dopo la risposta.",
    },
  ] as const;

  const tailored = [];

  if (urgenza === "alta") {
    tailored.push({
      titolo: "Decisione in 5 minuti",
      descrizione:
        "Imposta un timer: scegli una sola azione, scrivi il criterio e procedi. Niente ottimizzazione.",
    });
  }

  if (rischio === "alto") {
    tailored.push({
      titolo: "Mitiga rischio prima",
      descrizione:
        "Identifica il rischio #1 e riducilo con una verifica/backup. Poi scegli tra le opzioni rimanenti.",
    });
  }

  if (cooldown?.valore) {
    tailored.push({
      titolo: `Rimanda di ${cooldown.valore}${cooldown.unita ?? " ore"}`,
      descrizione:
        "Se non è bloccante, rimanda e raccogli un solo dato utile. Poi rivaluta con meno rumore.",
    });
  }

  if (budgetLine) {
    tailored.push({
      titolo: "Soluzione entro budget",
      descrizione: `Scegli l’alternativa più semplice che soddisfa l’obiettivo. ${budgetLine}`,
    });
  }

  return [...tailored, ...base].map((t) => ({
    ...t,
    descrizione: [t.descrizione, budgetLine].filter(Boolean).join(" "),
  }));
}

export function generateProposals(input: {
  contesto: string;
  obiettivo: string;
  urgenza: Urgenza;
  rischio: Rischio;
  constraints: Constraint[];
}) {
  const maxOptions = getMaxOptions(input.constraints);
  const seed = fnv1a(
    [
      input.obiettivo.trim().toLowerCase(),
      input.urgenza,
      input.rischio,
      input.constraints
        .map((c) => `${c.kind}:${c.valore ?? ""}:${c.nome}`.toLowerCase())
        .sort()
        .join("|"),
      input.contesto.trim().toLowerCase(),
    ].join("::")
  );

  const templates = optionTemplates({
    obiettivo: input.obiettivo,
    urgenza: input.urgenza,
    rischio: input.rischio,
    constraints: input.constraints,
  });

  const picked = pickDistinct(templates, seed, maxOptions);

  const options: ProposedOption[] = picked.map((t) => ({
    id: createId("o"),
    titolo: t.titolo,
    descrizione: t.descrizione,
  }));

  return { options, maxOptions };
}

export function snapshotConstraints(constraints: Constraint[]): Decision["vincoliSnapshot"] {
  return constraints.map((c) => ({
    id: c.id,
    nome: c.nome,
    kind: c.kind,
    valore: c.valore,
    unita: c.unita,
  }));
}

