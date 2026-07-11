import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

// Publik: prislistor per kategori (fillers per ml, toxin per område).
// Returnerar { fillers: {1:.., 2:..}, toxin: {..} }.
export async function GET() {
  try {
    const env = getCloudflareContext().env as any;
    const { results } = await env.DB.prepare(
      "SELECT category, quantity, amount FROM pricing_tiers"
    ).all();
    const tiers: Record<string, Record<number, number>> = {};
    for (const r of results ?? []) {
      (tiers[r.category] ||= {})[r.quantity] = r.amount;
    }
    return NextResponse.json({ ok: true, tiers });
  } catch (e) {
    console.error("Fel i /api/prices:", e);
    return NextResponse.json({ ok: false, tiers: {} }, { status: 500 });
  }
}
