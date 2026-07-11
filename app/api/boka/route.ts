import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validatePersonnummer } from "@/lib/personnummer";
import { verifyTurnstile } from "@/lib/turnstile";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/bookingEmails";
import { treatments } from "@/lib/treatments";

export const dynamic = "force-dynamic";

// Uppslag av namn/adress från personnummer – bundet till bokningen (serverside).
async function lookupNamnAdress(
  env: any,
  normalizedPnr: string
): Promise<{ namn?: string; adress?: string } | null> {
  const apiKey = env.PNR_LOOKUP_API_KEY;
  if (!apiKey) return null;
  // TODO: anropa vald tjänst med normalizedPnr och returnera namn/adress.
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slotId,
      personnummer,
      namn,
      adress,
      epost,
      telefon,
      omrade,
      meddelande,
      samtycke,
      turnstileToken,
    } = body ?? {};

    const env = getCloudflareContext().env as any;

    // 1) Turnstile
    const ip = request.headers.get("CF-Connecting-IP") || undefined;
    const human = await verifyTurnstile(
      turnstileToken || "",
      env.TURNSTILE_SECRET_KEY || "",
      ip
    );
    if (!human) {
      return NextResponse.json(
        { ok: false, error: "Verifiering misslyckades. Ladda om sidan och försök igen." },
        { status: 403 }
      );
    }

    if (!namn || !epost || !samtycke || !slotId || !personnummer) {
      return NextResponse.json(
        { ok: false, error: "Obligatoriska fält saknas." },
        { status: 400 }
      );
    }

    const pnr = validatePersonnummer(personnummer);
    if (!pnr.valid) {
      return NextResponse.json(
        { ok: false, error: pnr.error || "Ogiltigt personnummer." },
        { status: 400 }
      );
    }

    // Kontrollera att tiden är ledig
    const slot: any = await env.DB.prepare(
      "SELECT id, datum, tid, status FROM slots WHERE id = ?"
    )
      .bind(slotId)
      .first();
    if (!slot || slot.status !== "available") {
      return NextResponse.json(
        { ok: false, error: "Tiden är tyvärr inte längre tillgänglig. Välj en annan." },
        { status: 409 }
      );
    }

    // Pris för valt behandlingsområde
    const slug = treatments.find((t) => t.title === omrade)?.slug;
    let price = 0;
    if (slug) {
      const prow: any = await env.DB.prepare("SELECT amount FROM prices WHERE slug = ?")
        .bind(slug)
        .first();
      price = prow?.amount ?? 0;
    }

    // Uppslag (om konfigurerat)
    let finalNamn = namn;
    let finalAdress = adress ?? null;
    const uppslag = await lookupNamnAdress(env, pnr.normalized || "");
    if (uppslag) {
      if (uppslag.namn) finalNamn = uppslag.namn;
      if (uppslag.adress) finalAdress = uppslag.adress;
    }

    const token = crypto.randomUUID();
    const nar = `${slot.datum} kl. ${slot.tid}`;
    const base = env.SITE_URL || new URL(request.url).origin;

    // ---- Gratis (t.ex. konsultation): boka direkt ----
    if (price <= 0) {
      const upd = await env.DB.prepare(
        "UPDATE slots SET status = 'booked' WHERE id = ? AND status = 'available'"
      )
        .bind(slotId)
        .run();
      if (!upd.meta || upd.meta.changes !== 1) {
        return NextResponse.json(
          { ok: false, error: "Tiden hann bli bokad. Välj en annan tid." },
          { status: 409 }
        );
      }
      await env.DB.prepare(
        "INSERT INTO bookings (namn, epost, telefon, omrade, meddelande, personnummer, adress, slot_id, datum, tid, token, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')"
      )
        .bind(
          finalNamn, epost, telefon ?? null, omrade ?? null, meddelande ?? null,
          pnr.normalized ?? null, finalAdress, slotId, slot.datum, slot.tid, token, 0
        )
        .run();

      await sendBookingConfirmation(env, {
        namn: finalNamn, epost, telefon, omrade, meddelande,
        personnummer: pnr.display, adress: finalAdress,
        datum: slot.datum, tid: slot.tid, token, amount: 0,
      });
      return NextResponse.json({ ok: true, nar });
    }

    // ---- Betald behandling: håll tiden och skapa Stripe Checkout ----
    const hold = await env.DB.prepare(
      "UPDATE slots SET status = 'pending' WHERE id = ? AND status = 'available'"
    )
      .bind(slotId)
      .run();
    if (!hold.meta || hold.meta.changes !== 1) {
      return NextResponse.json(
        { ok: false, error: "Tiden hann bli bokad. Välj en annan tid." },
        { status: 409 }
      );
    }

    const ins = await env.DB.prepare(
      "INSERT INTO bookings (namn, epost, telefon, omrade, meddelande, personnummer, adress, slot_id, datum, tid, token, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    )
      .bind(
        finalNamn, epost, telefon ?? null, omrade ?? null, meddelande ?? null,
        pnr.normalized ?? null, finalAdress, slotId, slot.datum, slot.tid, token, price
      )
      .run();
    const bookingId = ins.meta?.last_row_id;

    try {
      const stripe = getStripe(env);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: epost,
        line_items: [
          {
            price_data: {
              currency: "sek",
              product_data: { name: `${omrade} – ${nar}` },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
        metadata: { bookingId: String(bookingId) },
        success_url: `${base}/boka/klar?token=${token}`,
        cancel_url: `${base}/boka`,
        expires_at: Math.floor(Date.now() / 1000) + 40 * 60,
      });
      return NextResponse.json({ ok: true, checkoutUrl: session.url });
    } catch (e) {
      console.error("Stripe-fel:", e);
      // Släpp tiden igen
      await env.DB.prepare(
        "UPDATE slots SET status = 'available' WHERE id = ? AND status = 'pending'"
      )
        .bind(slotId)
        .run();
      await env.DB.prepare("UPDATE bookings SET status = 'expired' WHERE id = ?")
        .bind(bookingId)
        .run();
      return NextResponse.json(
        { ok: false, error: "Kunde inte starta betalningen. Försök igen." },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("Fel i /api/boka:", e);
    return NextResponse.json(
      { ok: false, error: "Ogiltig förfrågan." },
      { status: 400 }
    );
  }
}
