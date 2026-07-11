import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validatePersonnummer } from "@/lib/personnummer";

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
    } = body ?? {};

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

    const env = getCloudflareContext().env as any;

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

    // Spara bokningen
    try {
      await env.DB.prepare(
        "INSERT INTO bookings (namn, epost, telefon, omrade, meddelande, personnummer, adress, slot_id, datum, tid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(
          namn,
          epost,
          telefon ?? null,
          omrade ?? null,
          meddelande ?? null,
          pnr.normalized ?? null,
          adress ?? null,
          slotId,
          slot.datum,
          slot.tid
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

    if (apiKey) {
      // Notis till kliniken
      await sendEmail(apiKey, {
        from,
        to: notify,
        subject: `Ny bokning – ${namn} (${nar})`,
        text:
          `Ny bokning via idunn-estetik.se:\n\n` +
          `Tid: ${nar} (30 min)\n` +
          `Namn: ${namn}\n` +
          `Personnummer: ${pnr.display}\n` +
          `Adress: ${adress || "-"}\n` +
          `E-post: ${epost}\n` +
          `Telefon: ${telefon || "-"}\n` +
          `Behandlingsområde: ${omrade || "-"}\n` +
          `Meddelande: ${meddelande || "-"}\n`,
      });

      // Bekräftelse till kunden
      await sendEmail(apiKey, {
        from,
        to: epost,
        reply_to: notify,
        subject: "Din bokning – Iðunn Estetik",
        text:
          `Hej ${namn},\n\n` +
          `Tack för din bokning hos Iðunn Estetik.\n\n` +
          `Tid: ${nar} (30 minuter)\n\n` +
          `Första besöket är alltid en lugn genomgång — ingen behandling utförs ` +
          `utan att du fått fullständig information.\n\n` +
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
