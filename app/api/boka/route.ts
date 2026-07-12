import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validatePersonnummer } from "@/lib/personnummer";
import { verifyTurnstile } from "@/lib/turnstile";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/bookingEmails";
import { categoryByKey, computeQuantity, combinedMinutes } from "@/lib/treatments";
import { requiredBlocks, slotTimes } from "@/lib/slots";
import { consultationRequired } from "@/lib/consultation";
import { stockholmMs } from "@/lib/time";
import { loadTreatmentAreas, quantitiesFromRows } from "@/lib/areas";

export const dynamic = "force-dynamic";

async function lookupNamnAdress(env: any, _pnr: string) {
  if (!env.PNR_LOOKUP_API_KEY) return null;
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      datum,
      tid,
      personnummer,
      namn,
      adress,
      epost,
      telefon,
      fillerAreas,
      toxinAreas,
      meddelande,
      samtycke,
      turnstileToken,
    } = body ?? {};

    const env = getCloudflareContext().env as any;

    const ip = request.headers.get("CF-Connecting-IP") || undefined;
    const human = await verifyTurnstile(turnstileToken || "", env.TURNSTILE_SECRET_KEY || "", ip);
    if (!human) {
      return NextResponse.json(
        { ok: false, error: "Verifiering misslyckades. Ladda om sidan och försök igen." },
        { status: 403 }
      );
    }

    if (!namn || !epost || !samtycke || !datum || !tid || !personnummer) {
      return NextResponse.json({ ok: false, error: "Obligatoriska fält saknas." }, { status: 400 });
    }

    const pnr = validatePersonnummer(personnummer);
    if (!pnr.valid) {
      return NextResponse.json({ ok: false, error: pnr.error || "Ogiltigt personnummer." }, { status: 400 });
    }

    // Starttiden måste vara en ledig tid
    const start: any = await env.DB.prepare(
      "SELECT status FROM slots WHERE datum = ? AND tid = ?"
    )
      .bind(datum, tid)
      .first();
    if (!start || start.status !== "available") {
      return NextResponse.json(
        { ok: false, error: "Tiden är tyvärr inte längre tillgänglig. Välj en annan." },
        { status: 409 }
      );
    }

    // Behandlingar och pris
    const fillersCat = categoryByKey("fillers")!;
    const toxinCat = categoryByKey("toxin")!;
    const fArr = Array.isArray(fillerAreas) ? fillerAreas : [];
    const tArr = Array.isArray(toxinAreas) ? toxinAreas : [];

    // Mängder från DB-områdena (källa till sanning). Faller tillbaka på gamla
    // hårdkodade områden + area_ml om treatment_areas saknas.
    let fillerMl: number;
    let toxinCount: number;
    const rows = await loadTreatmentAreas(env);
    if (rows) {
      const q = quantitiesFromRows(rows, fArr, tArr);
      if (q.invalid) {
        return NextResponse.json(
          { ok: false, error: "Ett valt område är inte tillgängligt. Ladda om sidan och försök igen." },
          { status: 400 }
        );
      }
      fillerMl = q.fillerMl;
      toxinCount = q.toxinCount;
    } else {
      const mlWeights: Record<string, number> = {};
      try {
        const mlr = await env.DB.prepare("SELECT area, ml FROM area_ml").all();
        for (const r of mlr.results ?? []) mlWeights[r.area] = r.ml;
      } catch {}
      fillerMl = computeQuantity(fillersCat, fArr, mlWeights);
      toxinCount = computeQuantity(toxinCat, tArr);
    }

    if (fillerMl > 4 || toxinCount > 4) {
      return NextResponse.json(
        { ok: false, error: "Max 4 ml fillers och 4 områden rynkbehandling per bokning." },
        { status: 400 }
      );
    }
    if (fillerMl < 1 && toxinCount < 1) {
      return NextResponse.json({ ok: false, error: "Välj minst ett område." }, { status: 400 });
    }

    async function priceFor(category: string, qty: number): Promise<number> {
      if (qty < 1) return 0;
      const row: any = await env.DB.prepare(
        "SELECT amount FROM pricing_tiers WHERE category = ? AND quantity = ?"
      )
        .bind(category, qty)
        .first();
      return row?.amount ?? 0;
    }
    const fillerPrice = await priceFor("fillers", fillerMl);
    const toxinPrice = await priceFor("toxin", toxinCount);
    const total = fillerPrice + toxinPrice;
    if (total <= 0) {
      return NextResponse.json({ ok: false, error: "Ogiltig behandling eller mängd." }, { status: 400 });
    }

    // Tid → block
    let timeCfg = { base: 15, per_ml: 10, per_area: 5 };
    try {
      const tc: any = await env.DB.prepare(
        "SELECT base, per_ml, per_area FROM time_config WHERE id = 1"
      ).first();
      if (tc) timeCfg = { base: tc.base, per_ml: tc.per_ml, per_area: tc.per_area };
    } catch {}
    const needMin = combinedMinutes(timeCfg, fillerMl, toxinCount);
    const blocks = requiredBlocks(needMin);
    const times = slotTimes(tid, blocks);
    const duration = blocks * 15;
    const placeholders = times.map(() => "?").join(", ");

    // Krock? (någon annan bokning på ett av blocken)
    const clash: any = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM slots WHERE datum = ? AND tid IN (${placeholders}) AND status IN ('booked','pending')`
    )
      .bind(datum, ...times)
      .first();
    if (clash && clash.n > 0) {
      return NextResponse.json(
        { ok: false, error: "Behandlingen ryms inte från den valda tiden — en annan bokning ligger i vägen. Välj en annan tid." },
        { status: 409 }
      );
    }

    // Behandlingstext
    const parts: string[] = [];
    if (fillerMl >= 1) parts.push(`Fillers: ${fArr.join(", ")} (${fillerMl} ml)`);
    if (toxinCount >= 1)
      parts.push(
        `Rynkbehandling: ${tArr.join(", ")} (${toxinCount} ${toxinCount === 1 ? "område" : "områden"})`
      );
    const omrade = parts.join("; ");

    // Konsultation (48h)
    const consult = await consultationRequired(env, pnr.normalized || "", [...fArr, ...tArr]);
    if (consult && stockholmMs(datum, tid) < Date.now() + 48 * 3600 * 1000) {
      return NextResponse.json(
        {
          ok: false,
          error: "Den här behandlingen kräver en konsultation minst 48 timmar innan. Välj en tid längre fram.",
        },
        { status: 400 }
      );
    }

    let finalNamn = namn;
    let finalAdress = adress ?? null;
    const uppslag = await lookupNamnAdress(env, pnr.normalized || "");
    if (uppslag) {
      if ((uppslag as any).namn) finalNamn = (uppslag as any).namn;
      if ((uppslag as any).adress) finalAdress = (uppslag as any).adress;
    }

    const token = crypto.randomUUID();
    const nar = `${datum} kl. ${tid}`;
    const base = env.SITE_URL || new URL(request.url).origin;

    // Håll alla block (pending). Skapa block-rader som saknas.
    for (const t of times) {
      await env.DB.prepare(
        "INSERT INTO slots (datum, tid, status, duration) VALUES (?, ?, 'pending', 15) ON CONFLICT(datum, tid) DO UPDATE SET status = 'pending'"
      )
        .bind(datum, t)
        .run();
    }

    const ins = await env.DB.prepare(
      "INSERT INTO bookings (namn, epost, telefon, omrade, meddelande, personnummer, adress, slot_id, datum, tid, token, amount, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'pending')"
    )
      .bind(
        finalNamn, epost, telefon ?? null, omrade, meddelande ?? null,
        pnr.normalized ?? null, finalAdress, datum, tid, token, total, duration
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
              unit_amount: total * 100,
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
      for (const t of times) {
        await env.DB.prepare(
          "UPDATE slots SET status = 'available' WHERE datum = ? AND tid = ? AND status = 'pending'"
        )
          .bind(datum, t)
          .run();
      }
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
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
