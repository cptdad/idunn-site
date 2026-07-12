import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validatePersonnummer } from "@/lib/personnummer";
import { verifyTurnstile } from "@/lib/turnstile";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/bookingEmails";
import { categoryByKey, computeQuantity, estimatedMinutes } from "@/lib/treatments";
import { requiredBlocks, slotTimes, BLOCK } from "@/lib/slots";
import { consultationRequired } from "@/lib/consultation";
import { stockholmMs } from "@/lib/time";

export const dynamic = "force-dynamic";

async function lookupNamnAdress(
  env: any,
  normalizedPnr: string
): Promise<{ namn?: string; adress?: string } | null> {
  const apiKey = env.PNR_LOOKUP_API_KEY;
  if (!apiKey) return null;
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
      category,
      areas,
      meddelande,
      samtycke,
      turnstileToken,
    } = body ?? {};

    const env = getCloudflareContext().env as any;

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

    // Starttid (block)
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

    // Pris
    const cat = categoryByKey(category);
    const mlWeights: Record<string, number> = {};
    try {
      const mlr = await env.DB.prepare("SELECT area, ml FROM area_ml").all();
      for (const r of mlr.results ?? []) mlWeights[r.area] = r.ml;
    } catch {}
    const qty = cat
      ? computeQuantity(cat, Array.isArray(areas) ? areas : [], mlWeights)
      : 0;
    let price = 0;
    if (cat && qty >= 1) {
      const prow: any = await env.DB.prepare(
        "SELECT amount FROM pricing_tiers WHERE category = ? AND quantity = ?"
      )
        .bind(category, qty)
        .first();
      price = prow?.amount ?? 0;
    }
    if (!cat || price <= 0) {
      return NextResponse.json(
        { ok: false, error: "Ogiltig behandling eller mängd." },
        { status: 400 }
      );
    }
    const areasArr = Array.isArray(areas) ? areas : [];
    const omrade = `${cat.title}: ${areasArr.join(", ") || "–"} (${qty} ${cat.unitPlural})`;

    // Lagstadgad konsultation (48h) – nya kunder / nya områden
    const consult = await consultationRequired(env, pnr.normalized || "", areasArr);
    if (consult && stockholmMs(slot.datum, slot.tid) < Date.now() + 48 * 3600 * 1000) {
      return NextResponse.json(
        {
          ok: false,
          error: "Den här behandlingen kräver en konsultation minst 48 timmar innan. Välj en tid längre fram.",
        },
        { status: 400 }
      );
    }

    // Behandlingstid → antal block → tider som måste vara lediga i följd
    let timeCfg = { base: 15, per_ml: 10, per_area: 5 };
    try {
      const tc: any = await env.DB.prepare(
        "SELECT base, per_ml, per_area FROM time_config WHERE id = 1"
      ).first();
      if (tc) timeCfg = { base: tc.base, per_ml: tc.per_ml, per_area: tc.per_area };
    } catch {}
    const needMin = estimatedMinutes(cat, qty, timeCfg);
    const blocks = requiredBlocks(needMin);
    const times = slotTimes(slot.tid, blocks);
    const duration = blocks * BLOCK;
    const placeholders = times.map(() => "?").join(", ");

    // Finns det tillräckligt med sammanhängande lediga block?
    const availRow: any = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM slots WHERE datum = ? AND tid IN (${placeholders}) AND status = 'available'`
    )
      .bind(slot.datum, ...times)
      .first();
    if (!availRow || availRow.n !== blocks) {
      return NextResponse.json(
        {
          ok: false,
          error: "Det finns inte tillräckligt med sammanhängande tid från den valda starttiden. Välj en annan tid.",
        },
        { status: 409 }
      );
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

    // Håll alla berörda block (pending)
    const hold = await env.DB.prepare(
      `UPDATE slots SET status = 'pending' WHERE datum = ? AND tid IN (${placeholders}) AND status = 'available'`
    )
      .bind(slot.datum, ...times)
      .run();
    if (!hold.meta || hold.meta.changes !== blocks) {
      await env.DB.prepare(
        `UPDATE slots SET status = 'available' WHERE datum = ? AND tid IN (${placeholders}) AND status = 'pending'`
      )
        .bind(slot.datum, ...times)
        .run();
      return NextResponse.json(
        { ok: false, error: "Tiden hann bli bokad. Välj en annan tid." },
        { status: 409 }
      );
    }

    const ins = await env.DB.prepare(
      "INSERT INTO bookings (namn, epost, telefon, omrade, meddelande, personnummer, adress, slot_id, datum, tid, token, amount, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    )
      .bind(
        finalNamn, epost, telefon ?? null, omrade ?? null, meddelande ?? null,
        pnr.normalized ?? null, finalAdress, slotId, slot.datum, slot.tid, token, price, duration
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
      await env.DB.prepare(
        `UPDATE slots SET status = 'available' WHERE datum = ? AND tid IN (${placeholders}) AND status = 'pending'`
      )
        .bind(slot.datum, ...times)
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
