import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

// Publik: lediga starttider + upptagna tider (framåt).
// Klienten erbjuder lediga tider som start och kollar att inget block i
// behandlingens längd krockar med en upptagen tid.
export async function GET() {
  try {
    const env = getCloudflareContext().env as any;
    const today = new Date().toISOString().slice(0, 10);
    const { results } = await env.DB.prepare(
      "SELECT datum, tid, status FROM slots WHERE datum >= ? ORDER BY datum, tid"
    )
      .bind(today)
      .all();
    const rows = results ?? [];
    const available = rows
      .filter((r: any) => r.status === "available")
      .map((r: any) => ({ datum: r.datum, tid: r.tid }));
    const occupied = rows
      .filter((r: any) => r.status === "booked" || r.status === "pending")
      .map((r: any) => ({ datum: r.datum, tid: r.tid }));
    return NextResponse.json({ ok: true, available, occupied });
  } catch (e) {
    console.error("Fel i /api/slots:", e);
    return NextResponse.json({ ok: false, available: [], occupied: [] }, { status: 500 });
  }
}
