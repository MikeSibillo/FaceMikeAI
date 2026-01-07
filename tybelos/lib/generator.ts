import type { DecisionOption, Rischio, Urgenza, Vincolo } from "@/lib/types";
import { fnv1a } from "@/lib/hash";

function readNumber(v: string): number | undefined {
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  return undefined;
}

function getMaxOptions(vincoli: Vincolo[]): number {
  const max = vincoli.find((v) => v.type === "max_options");
  const parsed = max ? readNumber(max.valore) : undefined;
  const n = parsed ?? 2;
  return Math.max(1, Math.min(2, Math.floor(n))); // hard cap: max 2
}

function getCooldownHours(vincoli: Vincolo[]): number | undefined {
  const cd = vincoli.find((v) => v.type === "cooldown_hours");
  const parsed = cd ? readNumber(cd.valore) : undefined;
  if (!parsed) return undefined;
  if (parsed <= 0) return undefined;
  return parsed;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

function baseOptionId(seed: number, idx: number) {
  return `opt_${seed.toString(16)}_${idx}`;
}

export function generaProposta(params: {
  contesto: string;
  obiettivo: string;
  vincoli: Vincolo[];
  urgenza: Urgenza;
  rischio: Rischio;
}): DecisionOption[] {
  const { contesto, obiettivo, vincoli, urgenza, rischio } = params;
  const maxOptions = getMaxOptions(vincoli);
  const cooldown = getCooldownHours(vincoli);

  // Deterministico: stessa tripletta (contesto+obiettivo+vincoli) => stesse opzioni.
  const seed = fnv1a(
    JSON.stringify({
      contesto: contesto.trim(),
      obiettivo: obiettivo.trim(),
      urgenza,
      rischio,
      vincoli: vincoli.map((v) => ({ type: v.type, nome: v.nome, valore: v.valore })).sort((a, b) => a.type.localeCompare(b.type))
    })
  );

  const library: Array<{ titolo: string; descrizione: string; tags: Array<"quick" | "safe" | "data" | "delegate" | "wait"> }> = [
    {
      titolo: "Procedi in piccolo (15–30 min)",
      descrizione: "Fai la versione minima reversibile. Se funziona, estendi. Se no, stop senza colpa.",
      tags: ["quick", "safe"]
    },
    {
      titolo: "Raccogli 1 dato in più",
      descrizione: "Identifica una sola informazione che riduce il rischio (es. costo reale, tempo stimato, feedback).",
      tags: ["data", "safe"]
    },
    {
      titolo: "Decidi e metti un checkpoint",
      descrizione: "Scegli ora, ma imposta un controllo a breve (es. domani). Se il segnale è negativo, cambia rotta.",
      tags: ["quick"]
    },
    {
      titolo: "Delegare / chiedere un parere mirato",
      descrizione: "Chiedi a una persona specifica una risposta binaria (Sì/No) o un rischio che vedi?",
      tags: ["delegate", "safe"]
    },
    {
      titolo: "Aspetta (cooldown)",
      descrizione: "Non decidere subito. Lascia decantare e riprendi con mente fresca.",
      tags: ["wait", "safe"]
    }
  ];

  const preferredTags: Array<"quick" | "safe" | "data" | "delegate" | "wait"> = [];
  if (urgenza === "alta") preferredTags.push("quick");
  if (rischio === "alto") preferredTags.push("safe", "data");
  if (cooldown) preferredTags.push("wait");

  const candidates = library
    .filter((o) => (cooldown ? true : !o.tags.includes("wait")))
    .filter((o) => (preferredTags.length === 0 ? true : preferredTags.some((t) => o.tags.includes(t))));

  const pool = candidates.length >= 2 ? candidates : library.filter((o) => (cooldown ? true : !o.tags.includes("wait")));

  const chosen: DecisionOption[] = [];
  const first = pick(pool, seed);
  chosen.push({ id: baseOptionId(seed, 0), titolo: first.titolo, descrizione: first.descrizione });

  if (maxOptions === 2) {
    // pick a second, different option
    const secondPool = pool.filter((o) => o.titolo !== first.titolo);
    const second = pick(secondPool.length ? secondPool : library, seed ^ 0x9e3779b9);
    chosen.push({ id: baseOptionId(seed, 1), titolo: second.titolo, descrizione: second.descrizione });
  }

  return chosen;
}

