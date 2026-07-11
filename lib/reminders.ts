// Skickar påminnelsemejl till kunder som har ett besök imorgon.
// Körs av cron via custom-worker.ts (scheduled handler).

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
  if (!res.ok) console.error("Resend-fel (påminnelse):", res.status);
  return res.ok;
}

export async function sendReminders(env: any): Promise<{ sent: number }> {
  const base = env.SITE_URL || "https://idunn-estetik.se/wip";
  const from = env.MAIL_FROM || "Idunn Estetik <onboarding@resend.dev>";
  const notify = env.NOTIFY_EMAIL || "info@idunn-estetik.se";
  const apiKey = env.RESEND_API_KEY;

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const { results } = await env.DB.prepare(
    "SELECT id, namn, epost, datum, tid, token, duration FROM bookings WHERE datum = ? AND status = 'active' AND reminded = 0"
  )
    .bind(tomorrow)
    .all();

  let sent = 0;
  for (const b of results ?? []) {
    if (apiKey && b.epost) {
      const link = `${base}/avboka?token=${b.token}`;
      await sendEmail(apiKey, {
        from,
        to: b.epost,
        reply_to: notify,
        subject: "Påminnelse om din tid imorgon – Iðunn Estetik",
        text:
          `Hej ${b.namn},\n\n` +
          `En vänlig påminnelse om din tid hos Iðunn Estetik imorgon:\n\n` +
          `Tid: ${b.datum} kl. ${b.tid} (${b.duration || 30} min)\n\n` +
          `Behöver du av- eller omboka? Använd din länk:\n${link}\n\n` +
          `Avbokning senare än 24 timmar före besöket debiteras med 50 % av ` +
          `behandlingens pris.\n\n` +
          `Vänliga hälsningar,\n` +
          `Iðunn Estetik Stockholm`,
      });
    }
    await env.DB.prepare("UPDATE bookings SET reminded = 1 WHERE id = ?")
      .bind(b.id)
      .run();
    sent++;
  }
  return { sent };
}
