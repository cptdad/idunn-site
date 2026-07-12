import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

function authOk(request: Request, env: any): boolean {
  const pw = request.headers.get("x-admin-password");
  return !!pw && pw === (env.ADMIN_PASSWORD || "");
}

// Lista avstängda områden.
export async function GET(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const disabledAreas: string[] = [];
  try {
    const { results } = await env.DB.prepare("SELECT area FROM disabled_areas").all();
    for (const r of results ?? []) disabledAreas.push(r.area);
  } catch {
    // tabellen kan saknas innan migrering
  }
  return NextResponse.json({ ok: true, disabledAreas });
}

// Slå på/av ett område. Body: { area, enabled }
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { area, enabled } = await request.json();
    if (!area || typeof area !== "string") {
      return NextResponse.json({ ok: false, error: "Område saknas." }, { status: 400 });
    }
    if (enabled) {
      await env.DB.prepare("DELETE FROM disabled_areas WHERE area = ?").bind(area).run();
    } else {
      await env.DB.prepare(
        "INSERT INTO disabled_areas (area) VALUES (?) ON CONFLICT(area) DO NOTHING"
      )
        .bind(area)
        .run();
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
