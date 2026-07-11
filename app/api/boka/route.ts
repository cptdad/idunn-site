import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validatePersonnummer } from "@/lib/personnummer";
import { verifyTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

type Msg = {
  from: string;
  to: string;
  subject: string;
  text: string;
  reply_to?: string;
};

async function sendEmail(apiKey: string, msg: Msg) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
  if (!res.ok) {
    console.error("Resend-fel:", res.status, await res.text());
  }
  return res.ok;
}

// Uppslag av namn/adress från personnummer – bundet till bokningen (serverside).
// Aktiveras när PNR_LOOKUP_API_KEY satts och tjänsten kopplats in.
async function lookupNamnAdress(
  env: any,
  normalizedPnr: string
): Promise<{ namn?: string; adress?: string } | null> {
  const apiKey = env.PNR_LOOKUP_API_KEY;
  if (!apiKey) return null;
  // TODO: anropa vald tjänst (t.ex. Roaring) med normalizedPnr och returnera namn/adress.
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

    // 1) Turnstile – blockera bottar/missbruk
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

    // Kontrollera att tiden fortfarande är ledig
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

    // Boka tiden atomärt (undvik dubbelbokning)
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

    // Uppslag bundet till bokningen (när tjänst är konfigurerad)
    let finalNamn = namn;
    let finalAdress = adress ?? null;
    const uppslag = await lookupNamnAdress(env, pnr.normalized || "");
    if (uppslag) {
      if (uppslag.namn) finalNamn = uppslag.namn;
      if (uppslag.adress) finalAdress = uppslag.adress;
    }

    // Token för av-/ombokningslänk
    const token = crypto.randomUUID();

    // Spara bokningen
    try {
      await env.DB.prepare(
        "INSERT INTO bookings (namn, epost, telefon, omrade, meddelande, personnummer, adress, slot_id, datum, tid, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(
          finalNamn,
          epost,
          telefon ?? null,
          omrade ?? null,
          meddelande ?? null,
          pnr.normalized ?? null,
          finalAdress,
          slotId,
          slot.datum,
          slot.tid,
          token
        )
        .run();
    } catch (e) {
      console.error("Kunde inte spara bokning i D1:", e);
    }

    // Mejl
    const apiKey: string | undefined = env.RESEND_API_KEY;
    const from: string =
      env.MAIL_FROM || "Idunn Estetik <onboarding@resend.dev>";
    const notify: string = env.NOTIFY_EMAIL || "cptdad12@proton.me";
    const nar = `${slot.datum} kl. ${slot.tid}`;
    const base = env.SITE_URL || new URL(request.url).origin;
    const avbokaLink = `${base}/avboka?token=${token}`;

    if (apiKey) {
      await sendEmail(apiKey, {
        from,
        to: notify,
        subject: `Ny bokning – ${finalNamn} (${nar})`,
        text:
          `Ny bokning via idunn-estetik.se:\n\n` +
          `Tid: ${nar} (30 min)\n` +
          `Namn: ${finalNamn}\n` +
          `Personnummer: ${pnr.display}\n` +
          `Adress: ${finalAdress || "-"}\n` +
          `E-post: ${epost}\n` +
          `Telefon: ${telefon || "-"}\n` +
          `Behandlingsområde: ${omrade || "-"}\n` +
          `Meddelande: ${meddelande || "-"}\n`,
      });

      await sendEmail(apiKey, {
        from,
        to: epost,
        reply_to: notify,
        subject: "Din bokning – Iðunn Estetik",
        text:
          `Hej ${finalNamn},\n\n` +
          `Tack för din bokning hos Iðunn Estetik.\n\n` +
          `Tid: ${nar} (30 minuter)\n\n` +
          `Första besöket är alltid en lugn genomgång — ingen behandling utförs ` +
          `utan att du fått fullständig information.\n\n` +
          `Behöver du av- eller omboka? Använd din länk:\n${avbokaLink}\n\n` +
          `Avbokning senare än 24 timmar före besöket debiteras med 50 % av ` +
          `behandlingens pris.\n\n` +
          `Vänliga hälsningar,\n` +
          `Iðunn Estetik Stockholm`,
      });
    } else {
      console.warn("RESEND_API_KEY saknas – hoppar över mejlutskick.");
    }

    return NextResponse.json({ ok: true, nar });
  } catch (e) {
    console.error("Fel i /api/boka:", e);
    return NextResponse.json(
      { ok: false, error: "Ogiltig förfrågan." },
      { status: 400 }
    );
  }
}
