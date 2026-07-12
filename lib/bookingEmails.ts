// Delad e-postlogik för bekräftade bokningar (används av /api/boka för gratis
// bokningar och av Stripe-webhooken när en betalning gått igenom).

type Booking = {
  id?: number;
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
  duration?: number | null;
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

// Behandlingsspecifik information till bekräftelsemejlet.
function careBlock(omrade: string): string {
  const isFiller = (omrade || "").toLowerCase().startsWith("fillers");
  if (isFiller) {
    return (
      `ATT TÄNKA PÅ INFÖR DIN FILLERSBEHANDLING\n` +
      `• Undvik blodförtunnande läkemedel (t.ex. Treo/acetylsalicylsyra, ibuprofen), fiskolja och omega-3 cirka en vecka innan om möjligt – minskar risken för blåmärken.\n` +
      `• Undvik alkohol de 24 timmarna innan.\n` +
      `• Planera inte behandlingen precis inför ett viktigt tillfälle – svullnad och blåmärken kan förekomma.\n` +
      `• Meddela oss vid graviditet/amning, pågående infektion eller feberblåsor.\n\n` +
      `ATT TÄNKA PÅ EFTER DIN FILLERSBEHANDLING\n` +
      `• Rör eller massera inte det behandlade området det första dygnet.\n` +
      `• Undvik hård träning, bastu, solarium och stark värme i 24–48 timmar.\n` +
      `• Undvik alkohol och smink på området det första dygnet.\n` +
      `• Svullnad, rodnad och blåmärken kan förekomma och avtar oftast inom några dagar.\n` +
      `• Kontakta oss omgående vid kraftig smärta, blekhet/missfärgning eller andra ovanliga besvär.`
    );
  }
  return (
    `ATT TÄNKA PÅ INFÖR DIN RYNKBEHANDLING\n` +
    `• Undvik blodförtunnande läkemedel, alkohol och omega-3 innan – minskar risken för blåmärken.\n` +
    `• Meddela oss vid graviditet/amning, neuromuskulär sjukdom eller mediciner du tar.\n\n` +
    `ATT TÄNKA PÅ EFTER DIN RYNKBEHANDLING\n` +
    `• Massera eller tryck inte på området, och undvik att ligga ner, de första 4 timmarna.\n` +
    `• Undvik hård träning, bastu och solarium det första dygnet.\n` +
    `• Effekten kommer gradvis under cirka 3–14 dagar.\n` +
    `• Undvik ansiktsbehandlingar och massage i området den första veckan.`
  );
}

// Områdesnamn ur omrade-strängen "Kategori: A, B (X ml)".
function parseAreas(omrade: string): string[] {
  const after = (omrade || "").split(": ")[1] || "";
  const names = after.split(" (")[0] || "";
  return names
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Krävs lagstadgad konsultation? Ja om kunden är ny (inget tidigare besök),
// eller om något valt område inte behandlats de senaste sex månaderna.
async function needsConsultation(env: any, b: Booking): Promise<boolean> {
  const pnr = b.personnummer;
  if (!pnr) return true;
  try {
    const { results } = await env.DB.prepare(
      "SELECT omrade, datum FROM bookings WHERE personnummer = ? AND status = 'active' AND id != ?"
    )
      .bind(pnr, b.id ?? -1)
      .all();
    const prior = results ?? [];
    if (prior.length === 0) return true; // ny kund
    const sixMonthsAgo = new Date(Date.now() - 182 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const treated = new Set<string>();
    for (const p of prior) {
      if (p.datum >= sixMonthsAgo) {
        for (const a of parseAreas(p.omrade)) treated.add(a);
      }
    }
    const current = parseAreas(b.omrade || "");
    return current.some((a) => !treated.has(a)); // nytt/olämnat område
  } catch {
    return true; // vid osäkerhet: visa konsultationstexten
  }
}

export async function sendBookingConfirmation(env: any, b: Booking) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = env.MAIL_FROM || "Idunn Estetik <onboarding@resend.dev>";
  const notify = env.NOTIFY_EMAIL || "info@idunn-estetik.se";
  const base = env.SITE_URL || "https://idunn-estetik.se/wip";
  const nar = `${b.datum} kl. ${b.tid}`;
  const langd = b.duration || 30;
  const link = `${base}/avboka?token=${b.token}`;
  const belopp = b.amount ? `${b.amount} kr (betald)` : "-";
  const consultation = await needsConsultation(env, b);

  // Notis till kliniken
  await sendEmail(apiKey, {
    from,
    to: notify,
    subject: `Ny bokning – ${b.namn} (${nar})`,
    text:
      `Ny bokning via idunn-estetik.se:\n\n` +
      `Tid: ${nar} (${langd} min)\n` +
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
      `Tid: ${nar} (${langd} minuter)\n\n` +
      (consultation
        ? `Vi kommer kontakta dig 48 timmar innan inbokad behandling för en lagstadgad konsultation.\n\n`
        : "") +
      `Behöver du av- eller omboka? Använd din länk:\n${link}\n\n` +
      `Avbokning senare än 24 timmar före besöket debiteras med 50 % av ` +
      `behandlingens pris.\n\n` +
      `— — —\n\n` +
      `${careBlock(b.omrade || "")}\n\n` +
      `— — —\n\n` +
      `Vi hoppas att du kommer bli nöjd med din behandling!\n\n` +
      `Vänliga hälsningar,\n` +
      `Iðunn Estetik Stockholm`,
  });
}
