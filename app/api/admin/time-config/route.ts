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
  const tc: any = await env.DB.prepare(
    "SELECT base, per_ml, per_area FROM time_config WHERE id = 1"
  ).first();
  return NextResponse.json({
    ok: true,
    timeConfig: tc || { base: 15, per_ml: 10, per_area: 5 },
  });
}

export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { base, per_ml, per_area } = await request.json();
    const b = Math.max(0, Math.round(Number(base)));
    const pm = Math.max(0, Math.round(Number(per_ml)));
    const pa = Math.max(0, Math.round(Number(per_area)));
    if ([b, pm, pa].some((n) => Number.isNaN(n))) {
      return NextResponse.json({ ok: false, error: "Ogiltiga värden." }, { status: 400 });
    }
    await env.DB.prepare(
      "INSERT INTO time_config (id, base, per_ml, per_area) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET base = excluded.base, per_ml = excluded.per_ml, per_area = excluded.per_area"
    )
      .bind(b, pm, pa)
      .run();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
