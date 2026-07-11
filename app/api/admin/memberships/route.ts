import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function authOk(request: Request, env: any): boolean {
  const pw = request.headers.get("x-admin-password");
  return !!pw && pw === (env.ADMIN_PASSWORD || "");
}

// Admin: lista medlemskap.
export async function GET(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const { results } = await env.DB.prepare(
    "SELECT id, namn, email, amount, status, created_at FROM memberships ORDER BY created_at DESC"
  ).all();
  return NextResponse.json({ ok: true, memberships: results ?? [] });
}

// Admin: avsluta ett medlemskap (avbryter Stripe-prenumerationen).
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { id, action } = await request.json();
    if (action !== "cancel" || !id) {
      return NextResponse.json({ ok: false, error: "Ogiltig åtgärd." }, { status: 400 });
    }
    const m: any = await env.DB.prepare(
      "SELECT stripe_subscription_id FROM memberships WHERE id = ?"
    )
      .bind(id)
      .first();
    if (m?.stripe_subscription_id) {
      try {
        const stripe = getStripe(env);
        await stripe.subscriptions.cancel(m.stripe_subscription_id);
      } catch (e) {
        console.error("Kunde inte avbryta Stripe-prenumeration:", e);
      }
    }
    await env.DB.prepare("UPDATE memberships SET status = 'cancelled' WHERE id = ?")
      .bind(id)
      .run();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
