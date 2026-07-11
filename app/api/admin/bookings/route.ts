import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

function authOk(request: Request, env: any): boolean {
  const pw = request.headers.get("x-admin-password");
  return !!pw && pw === (env.ADMIN_PASSWORD || "");
}

// Admin: lista bokningar.
export async function GET(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const { results } = await env.DB.prepare(
    "SELECT id, namn, epost, telefon, personnummer, adress, omrade, datum, tid, status, meddelande, created_at FROM bookings WHERE status IN ('active', 'cancelled') ORDER BY datum DESC, tid DESC"
  ).all();
  return NextResponse.json({ ok: true, bookings: results ?? [] });
}

// Admin: avboka (frigör tiden).
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { id, action } = await request.json();
    if (action !== "cancel" || !id) {
      return NextResponse.json({ ok: false, error: "Ogiltig åtgärd." }, { status: 400 });
    }
    const b: any = await env.DB.prepare("SELECT slot_id FROM bookings WHERE id = ?")
      .bind(id)
      .first();
    await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?")
      .bind(id)
      .run();
    if (b && b.slot_id) {
      await env.DB.prepare("UPDATE slots SET status = 'available' WHERE id = ?")
        .bind(b.slot_id)
        .run();
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
