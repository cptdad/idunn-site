import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

// Publik: prislistor (per kategori) + ml-vikter per fillerområde.
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

    const mlWeights: Record<string, number> = {};
    try {
      const mlr = await env.DB.prepare("SELECT area, ml FROM area_ml").all();
      for (const r of mlr.results ?? []) mlWeights[r.area] = r.ml;
    } catch {
      // area_ml kan saknas innan migrering – ignorera
    }

    return NextResponse.json({ ok: true, tiers, mlWeights });
  } catch (e) {
    console.error("Fel i /api/prices:", e);
    return NextResponse.json({ ok: false, tiers: {}, mlWeights: {} }, { status: 500 });
  }
}
