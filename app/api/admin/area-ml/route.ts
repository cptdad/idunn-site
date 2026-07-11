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
  const { results } = await env.DB.prepare("SELECT area, ml FROM area_ml").all();
  const mlWeights: Record<string, number> = {};
  for (const r of results ?? []) mlWeights[r.area] = r.ml;
  return NextResponse.json({ ok: true, mlWeights });
}

export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { area, ml } = await request.json();
    const m = Math.max(0, Math.round(Number(ml)));
    if (!area || Number.isNaN(m)) {
      return NextResponse.json({ ok: false, error: "Ogiltigt värde." }, { status: 400 });
    }
    await env.DB.prepare(
      "INSERT INTO area_ml (area, ml) VALUES (?, ?) ON CONFLICT(area) DO UPDATE SET ml = excluded.ml"
    )
      .bind(area, m)
      .run();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
