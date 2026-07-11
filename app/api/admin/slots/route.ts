import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

function authOk(request: Request, env: any): boolean {
  const pw = request.headers.get("x-admin-password");
  return !!pw && pw === (env.ADMIN_PASSWORD || "");
}

// Admin: alla tider framåt (inkl. bokade).
export async function GET(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const { results } = await env.DB.prepare(
    "SELECT id, datum, tid, status, duration FROM slots WHERE datum >= ? ORDER BY datum, tid"
  )
    .bind(today)
    .all();
  return NextResponse.json({ ok: true, slots: results ?? [] });
}

// Admin: skapa tid(er) med vald längd. { datum, tid, duration } eller
// { datum, start, slut, duration } (genererar tider med steg = längden).
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const duration = clampDuration(body.duration);
    const times = buildTimes(body, duration);
    if (!times.length) {
      return NextResponse.json({ ok: false, error: "Inga giltiga tider." }, { status: 400 });
    }
    let added = 0;
    for (const t of times) {
      const r = await env.DB.prepare(
        "INSERT OR IGNORE INTO slots (datum, tid, duration) VALUES (?, ?, ?)"
      )
        .bind(t.datum, t.tid, duration)
        .run();
      if (r.meta && r.meta.changes) added += r.meta.changes;
    }
    return NextResponse.json({ ok: true, added });
  } catch (e) {
    console.error("Fel i POST /api/admin/slots:", e);
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}

// Admin: ta bort en tid.
export async function DELETE(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id saknas." }, { status: 400 });
  }
  await env.DB.prepare("DELETE FROM slots WHERE id = ?").bind(id).run();
  return NextResponse.json({ ok: true });
}

function clampDuration(d: any): number {
  const n = Math.round(Number(d));
  return [30, 45, 60, 90].includes(n) ? n : 30;
}

function buildTimes(body: any, duration: number): { datum: string; tid: string }[] {
  const datum = body?.datum;
  if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) return [];
  if (body.tid) {
    const tid = normalizeTime(body.tid);
    return tid ? [{ datum, tid }] : [];
  }
  if (body.start && body.slut) {
    const start = toMinutes(body.start);
    const slut = toMinutes(body.slut);
    if (start == null || slut == null) return [];
    const out: { datum: string; tid: string }[] = [];
    for (let cur = start; cur < slut; cur += duration) {
      out.push({ datum, tid: fromMinutes(cur) });
    }
    return out;
  }
  return [];
}

function normalizeTime(t: string): string {
  const m = toMinutes(t);
  return m == null ? "" : fromMinutes(m);
}
function toMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((t || "").trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
function fromMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const mi = m % 60;
  return String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0");
}
