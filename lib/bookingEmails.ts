// Delad e-postlogik för bekräftade bokningar (används av /api/boka för gratis
// bokningar och av Stripe-webhooken när en betalning gått igenom).

type Booking = {
  namn: string;
  epost: string;
  telefon?: string | null;
  omrade?: string | null;
  meddelande?: string | null;
  personnummer?: string | null;
  adress?: string | null;
  datum: string;
  tid: string;
  token: string;
  amount?: number | null;
};

async function sendEmail(
  apiKey: string,
  msg: { from: string; to: string; subject: string; text: string; reply_to?: string }
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
  if (!res.ok) console.error("Resend-fel:", res.status, await res.text());
  return res.ok;
}

export async function sendBookingConfirmation(env: any, b: Booking) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = env.MAIL_FROM || "Idunn Estetik <onboarding@resend.dev>";
  const notify = env.NOTIFY_EMAIL || "info@idunn-estetik.se";
  const base = env.SITE_URL || "https://idunn-estetik.se/wip";
  const nar = `${b.datum} kl. ${b.tid}`;
  const link = `${base}/avboka?token=${b.token}`;
  const belopp = b.amount ? `${b.amount} kr (betald)` : "-";

  // Notis till kliniken
  await sendEmail(apiKey, {
    from,
    to: notify,
    subject: `Ny bokning – ${b.namn} (${nar})`,
    text:
      `Ny bokning via idunn-estetik.se:\n\n` +
      `Tid: ${nar} (30 min)\n` +
      `Namn: ${b.namn}\n` +
      `Personnummer: ${b.personnummer || "-"}\n` +
      `Adress: ${b.adress || "-"}\n` +
      `E-post: ${b.epost}\n` +
      `Telefon: ${b.telefon || "-"}\n` +
      `Behandlingsområde: ${b.omrade || "-"}\n` +
      `Belopp: ${belopp}\n` +
      `Meddelande: ${b.meddelande || "-"}\n`,
  });

  // Bekräftelse till kunden
  await sendEmail(apiKey, {
    from,
    to: b.epost,
    reply_to: notify,
    subject: "Din bokning – Iðunn Estetik",
    text:
      `Hej ${b.namn},\n\n` +
      `Tack för din bokning hos Iðunn Estetik.\n\n` +
      `Tid: ${nar} (30 minuter)\n\n` +
      `Första besöket är alltid en lugn genomgång — ingen behandling utförs ` +
      `utan att du fått fullständig information.\n\n` +
      `Behöver du av- eller omboka? Använd din länk:\n${link}\n\n` +
      `Avbokning senare än 24 timmar före besöket debiteras med 50 % av ` +
      `behandlingens pris.\n\n` +
      `Vänliga hälsningar,\n` +
      `Iðunn Estetik Stockholm`,
  });
}
