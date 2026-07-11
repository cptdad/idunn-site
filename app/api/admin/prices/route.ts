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
  const { results } = await env.DB.prepare("SELECT slug, amount FROM prices").all();
  const prices: Record<string, number> = {};
  for (const r of results ?? []) prices[r.slug] = r.amount;
  return NextResponse.json({ ok: true, prices });
}

export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { slug, amount } = await request.json();
    const amt = Math.max(0, Math.round(Number(amount)));
    if (!slug || Number.isNaN(amt)) {
      return NextResponse.json({ ok: false, error: "Ogiltigt pris." }, { status: 400 });
    }
    await env.DB.prepare(
      "INSERT INTO prices (slug, amount, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(slug) DO UPDATE SET amount = excluded.amount, updated_at = datetime('now')"
    )
      .bind(slug, amt)
      .run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Fel i POST /api/admin/prices:", e);
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
