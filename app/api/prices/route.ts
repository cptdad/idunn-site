import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

// Publik: priser per behandlingsområde (slug -> belopp i kr).
export async function GET() {
  try {
    const env = getCloudflareContext().env as any;
    const { results } = await env.DB.prepare("SELECT slug, amount FROM prices").all();
    const prices: Record<string, number> = {};
    for (const r of results ?? []) prices[r.slug] = r.amount;
    return NextResponse.json({ ok: true, prices });
  } catch (e) {
    console.error("Fel i /api/prices:", e);
    return NextResponse.json({ ok: false, prices: {} }, { status: 500 });
  }
}
