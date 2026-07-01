import { NextResponse } from "next/server";
import { clamp01, fnv1a } from "@/lib/hash";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;

  const text = JSON.stringify(body ?? {});
  const h = fnv1a(text);

  // Placeholder "AI score": deterministic in [0,1]
  const score = clamp01(((h % 10_000) / 10_000) * 0.9 + 0.05);

  return NextResponse.json({
    score,
    model: "stub-v0",
    note: "Placeholder: score finta e deterministica (nessuna AI reale)."
  });
}

