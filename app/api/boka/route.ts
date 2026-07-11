import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
    const { namn, epost, telefon, omrade, meddelande, samtycke } = body ?? {};

    if (!namn || !epost || !samtycke) {
      return NextResponse.json(
        { ok: false, error: "Obligatoriska fält saknas." },
        { status: 400 }
      );
    }

    // Cloudflare-bindings (D1-databas, env-variabler)
    const env = getCloudflareContext().env as any;

    // 1) Spara förfrågan i databasen (D1)
    try {
      await env.DB.prepare(
        "INSERT INTO bookings (namn, epost, telefon, omrade, meddelande) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(namn, epost, telefon ?? null, omrade ?? null, meddelande ?? null)
        .run();
    } catch (e) {
      console.error("Kunde inte spara bokning i D1:", e);
    }

    // 2) Skicka mejl via Resend (om nyckel finns)
    const apiKey: string | undefined = env.RESEND_API_KEY;
    const from: string =
      env.MAIL_FROM || "Idunn Estetik <onboarding@resend.dev>";
    const notify: string = env.NOTIFY_EMAIL || "cptdad12@proton.me";

    if (apiKey) {
      // Notis till kliniken
      await sendEmail(apiKey, {
        from,
        to: notify,
        subject: `Ny bokningsförfrågan – ${namn}`,
        text:
          `Ny förfrågan via idunn-estetik.se:\n\n` +
          `Namn: ${namn}\n` +
          `E-post: ${epost}\n` +
          `Telefon: ${telefon || "-"}\n` +
          `Behandlingsområde: ${omrade || "-"}\n` +
          `Meddelande: ${meddelande || "-"}\n`,
      });

      // Bekräftelse till kunden (svar går till kliniken)
      await sendEmail(apiKey, {
        from,
        to: epost,
        reply_to: notify,
        subject: "Tack för din förfrågan – Iðunn Estetik",
        text:
          `Hej ${namn},\n\n` +
          `Tack för din förfrågan till Iðunn Estetik. Vi återkommer med förslag ` +
          `på tid för din konsultation.\n\n` +
          `Första besöket är alltid en lugn genomgång — ingen behandling utförs ` +
          `utan att du fått fullständig information.\n\n` +
          `Vänliga hälsningar,\n` +
          `Iðunn Estetik Stockholm`,
      });
    } else {
      console.warn("RESEND_API_KEY saknas – hoppar över mejlutskick.");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Fel i /api/boka:", e);
    return NextResponse.json(
      { ok: false, error: "Ogiltig förfrågan." },
      { status: 400 }
    );
  }
}
