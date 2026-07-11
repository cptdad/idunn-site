import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

async function getBooking(env: any, token: string) {
  return await env.DB.prepare(
    "SELECT id, namn, datum, tid, status, slot_id FROM bookings WHERE token = ?"
  )
    .bind(token)
    .first();
}

// Hämta bokning via token (för av-/ombokningssidan).
export async function GET(request: Request) {
  const env = getCloudflareContext().env as any;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Länk saknas." }, { status: 400 });
  }
  const b: any = await getBooking(env, token);
  if (!b) {
    return NextResponse.json({ ok: false, error: "Bokningen hittades inte." }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    booking: { namn: b.namn, datum: b.datum, tid: b.tid, status: b.status },
  });
}

// Avboka eller omboka.
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  try {
    const { token, action, newSlotId } = await request.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: "Länk saknas." }, { status: 400 });
    }
    const b: any = await getBooking(env, token);
    if (!b) {
      return NextResponse.json({ ok: false, error: "Bokningen hittades inte." }, { status: 404 });
    }
    if (b.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Bokningen är redan avbokad." },
        { status: 409 }
      );
    }

    if (action === "cancel") {
      await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?")
        .bind(b.id)
        .run();
      if (b.slot_id) {
        await env.DB.prepare("UPDATE slots SET status = 'available' WHERE id = ?")
          .bind(b.slot_id)
          .run();
      }
      return NextResponse.json({ ok: true, cancelled: true });
    }

    if (action === "reschedule") {
      if (!newSlotId) {
        return NextResponse.json({ ok: false, error: "Välj en ny tid." }, { status: 400 });
      }
      const slot: any = await env.DB.prepare(
        "SELECT id, datum, tid, status FROM slots WHERE id = ?"
      )
        .bind(newSlotId)
        .first();
      if (!slot || slot.status !== "available") {
        return NextResponse.json(
          { ok: false, error: "Tiden är inte längre tillgänglig." },
          { status: 409 }
        );
      }
      const upd = await env.DB.prepare(
        "UPDATE slots SET status = 'booked' WHERE id = ? AND status = 'available'"
      )
        .bind(newSlotId)
        .run();
      if (!upd.meta || upd.meta.changes !== 1) {
        return NextResponse.json(
          { ok: false, error: "Tiden hann bli bokad. Välj en annan." },
          { status: 409 }
        );
      }
      if (b.slot_id) {
        await env.DB.prepare("UPDATE slots SET status = 'available' WHERE id = ?")
          .bind(b.slot_id)
          .run();
      }
      await env.DB.prepare(
        "UPDATE bookings SET slot_id = ?, datum = ?, tid = ?, reminded = 0 WHERE id = ?"
      )
        .bind(newSlotId, slot.datum, slot.tid, b.id)
        .run();
      return NextResponse.json({ ok: true, nar: `${slot.datum} kl. ${slot.tid}` });
    }

    return NextResponse.json({ ok: false, error: "Okänd åtgärd." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
