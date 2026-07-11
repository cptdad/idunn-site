import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

// Publik: lista lediga tider (framåt i tiden).
export async function GET() {
  try {
    const env = getCloudflareContext().env as any;
    const today = new Date().toISOString().slice(0, 10);
    const { results } = await env.DB.prepare(
      "SELECT id, datum, tid FROM slots WHERE status = 'available' AND datum >= ? ORDER BY datum, tid"
    )
      .bind(today)
      .all();
    return NextResponse.json({ ok: true, slots: results ?? [] });
  } catch (e) {
    console.error("Fel i /api/slots:", e);
    return NextResponse.json({ ok: false, slots: [] }, { status: 500 });
  }
}
