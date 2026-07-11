import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

function authOk(request: Request, env: any): boolean {
  const pw = request.headers.get("x-admin-password");
  return !!pw && pw === (env.ADMIN_PASSWORD || "");
}

export async function GET(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const { results } = await env.DB.prepare(
    "SELECT category, quantity, amount FROM pricing_tiers"
  ).all();
  const tiers: Record<string, Record<number, number>> = {};
  for (const r of results ?? []) {
    (tiers[r.category] ||= {})[r.quantity] = r.amount;
  }
  return NextResponse.json({ ok: true, tiers });
}

export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { category, quantity, amount } = await request.json();
    const q = Math.round(Number(quantity));
    const amt = Math.max(0, Math.round(Number(amount)));
    if (!category || !q || Number.isNaN(amt)) {
      return NextResponse.json({ ok: false, error: "Ogiltigt pris." }, { status: 400 });
    }
    await env.DB.prepare(
      "INSERT INTO pricing_tiers (category, quantity, amount) VALUES (?, ?, ?) ON CONFLICT(category, quantity) DO UPDATE SET amount = excluded.amount"
    )
      .bind(category, q, amt)
      .run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Fel i POST /api/admin/prices:", e);
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
