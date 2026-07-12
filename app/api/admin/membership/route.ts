import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function authOk(request: Request, env: any): boolean {
  const pw = request.headers.get("x-admin-password");
  return !!pw && pw === (env.ADMIN_PASSWORD || "");
}

// Admin: skapa en medlemskapslänk (Stripe-prenumeration med individuellt belopp).
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { email, namn, amount } = await request.json();
    const amt = Math.round(Number(amount));
    if (!email || !amt || amt <= 0) {
      return NextResponse.json({ ok: false, error: "Ange e-post och ett belopp." }, { status: 400 });
    }
    const base = env.SITE_URL || new URL(request.url).origin;
    const stripe = getStripe(env);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: { name: "Iðunn Naturligt underhåll" },
            unit_amount: amt * 100,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: { type: "membership", email, namn: namn || "", amount: String(amt) },
      subscription_data: {
        metadata: { type: "membership", email, namn: namn || "" },
      },
      success_url: `${base}/medlemskap/klar`,
      cancel_url: `${base}/naturligt-underhall`,
    });

    // Skicka länken direkt till kunden via e-post.
    let emailed = false;
    const apiKey = env.RESEND_API_KEY;
    if (apiKey && session.url) {
      const from = env.MAIL_FROM || "Idunn Estetik <onboarding@resend.dev>";
      const notify = env.NOTIFY_EMAIL || "info@idunn-estetik.se";
      const hej = namn ? `Hej ${namn},` : "Hej,";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: email,
          reply_to: notify,
          subject: "Ditt medlemskap – Iðunn Naturligt underhåll",
          text:
            `${hej}\n\n` +
            `Tack för att du vill bli medlem i Iðunn Naturligt underhåll.\n\n` +
            `Ditt månadsbelopp är ${amt} kr och dras automatiskt varje månad.\n\n` +
            `Slutför din anmälan och lägg till ditt kort här:\n${session.url}\n\n` +
            `Du kan avsluta medlemskapet när du vill – hör bara av dig till oss.\n\n` +
            `Vänliga hälsningar,\n` +
            `Iðunn Estetik Stockholm`,
        }),
      });
      emailed = res.ok;
      if (!res.ok) console.error("Resend-fel (membership):", res.status, await res.text());
    }

    return NextResponse.json({ ok: true, url: session.url, emailed });
  } catch (e) {
    console.error("Stripe-fel (membership):", e);
    return NextResponse.json(
      { ok: false, error: "Kunde inte skapa medlemskapslänk." },
      { status: 502 }
    );
  }
}
