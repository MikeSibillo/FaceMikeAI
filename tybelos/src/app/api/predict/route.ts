import { NextResponse } from "next/server";
import { fnv1a, stableStringify } from "@/lib/utils/hash";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Placeholder deterministic "AI" score in [0, 1].
  const h = fnv1a(stableStringify(body));
  const score = Math.round(((h % 1000) / 1000) * 1000) / 1000;

  return NextResponse.json({ score });
}

