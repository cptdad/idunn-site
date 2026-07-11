import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { refundBooking, hoursUntil } from "@/lib/refunds";
import { requiredBlocks, slotTimes } from "@/lib/slots";

export const dynamic = "force-dynamic";

async function getBooking(env: any, token: string) {
  return await env.DB.prepare(
    "SELECT id, namn, datum, tid, status, slot_id, amount, stripe_payment_intent, duration FROM bookings WHERE token = ?"
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
    booking: {
      namn: b.namn,
      datum: b.datum,
      tid: b.tid,
      status: b.status,
      duration: b.duration,
    },
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
      // >24h innan = full återbetalning, annars 50 % (kliniken behåller 50 %)
      const fraction = hoursUntil(b.datum, b.tid) > 24 ? 1 : 0.5;
      await refundBooking(env, b, fraction);
      await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?")
        .bind(b.id)
        .run();
      const times = slotTimes(b.tid, requiredBlocks(b.duration || 30));
      const ph = times.map(() => "?").join(", ");
      await env.DB.prepare(
        `UPDATE slots SET status = 'available' WHERE datum = ? AND tid IN (${ph}) AND status = 'booked'`
      )
        .bind(b.datum, ...times)
        .run();
      return NextResponse.json({ ok: true, cancelled: true, refundFraction: fraction });
    }

    if (action === "reschedule") {
      if (!newSlotId) {
        return NextResponse.json({ ok: false, error: "Välj en ny tid." }, { status: 400 });
      }
      const startSlot: any = await env.DB.prepare(
        "SELECT id, datum, tid, status FROM slots WHERE id = ?"
      )
        .bind(newSlotId)
        .first();
      if (!startSlot || startSlot.status !== "available") {
        return NextResponse.json(
          { ok: false, error: "Tiden är inte längre tillgänglig." },
          { status: 409 }
        );
      }
      const blocks = requiredBlocks(b.duration || 30);
      const newTimes = slotTimes(startSlot.tid, blocks);
      const nph = newTimes.map(() => "?").join(", ");
      const availRow: any = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM slots WHERE datum = ? AND tid IN (${nph}) AND status = 'available'`
      )
        .bind(startSlot.datum, ...newTimes)
        .first();
      if (!availRow || availRow.n !== blocks) {
        return NextResponse.json(
          {
            ok: false,
            error: "Det finns inte tillräckligt med sammanhängande tid från den nya starttiden.",
          },
          { status: 409 }
        );
      }
      await env.DB.prepare(
        `UPDATE slots SET status = 'booked' WHERE datum = ? AND tid IN (${nph}) AND status = 'available'`
      )
        .bind(startSlot.datum, ...newTimes)
        .run();
      const oldTimes = slotTimes(b.tid, requiredBlocks(b.duration || 30));
      const oph = oldTimes.map(() => "?").join(", ");
      await env.DB.prepare(
        `UPDATE slots SET status = 'available' WHERE datum = ? AND tid IN (${oph}) AND status = 'booked'`
      )
        .bind(b.datum, ...oldTimes)
        .run();
      await env.DB.prepare(
        "UPDATE bookings SET slot_id = ?, datum = ?, tid = ?, reminded = 0 WHERE id = ?"
      )
        .bind(newSlotId, startSlot.datum, startSlot.tid, b.id)
        .run();
      return NextResponse.json({ ok: true, nar: `${startSlot.datum} kl. ${startSlot.tid}` });
    }

    return NextResponse.json({ ok: false, error: "Okänd åtgärd." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
