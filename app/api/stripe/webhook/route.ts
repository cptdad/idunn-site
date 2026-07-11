import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/bookingEmails";
import { requiredBlocks, slotTimes } from "@/lib/slots";

export const dynamic = "force-dynamic";

async function finalizeBooking(
  env: any,
  bookingId: string,
  paymentIntent: string | null
) {
  const b: any = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?")
    .bind(bookingId)
    .first();
  if (!b || b.status !== "pending") return; // idempotent
  await env.DB.prepare(
    "UPDATE bookings SET status = 'active', stripe_payment_intent = ? WHERE id = ?"
  )
    .bind(paymentIntent, bookingId)
    .run();
  const times = slotTimes(b.tid, requiredBlocks(b.duration || 30));
  const ph = times.map(() => "?").join(", ");
  await env.DB.prepare(
    `UPDATE slots SET status = 'booked' WHERE datum = ? AND tid IN (${ph}) AND status = 'pending'`
  )
    .bind(b.datum, ...times)
    .run();
  await sendBookingConfirmation(env, b);
}

async function releaseBooking(env: any, bookingId: string) {
  const b: any = await env.DB.prepare(
    "SELECT datum, tid, duration, status FROM bookings WHERE id = ?"
  )
    .bind(bookingId)
    .first();
  if (!b || b.status !== "pending") return;
  await env.DB.prepare("UPDATE bookings SET status = 'expired' WHERE id = ?")
    .bind(bookingId)
    .run();
  const times = slotTimes(b.tid, requiredBlocks(b.duration || 30));
  const ph = times.map(() => "?").join(", ");
  await env.DB.prepare(
    `UPDATE slots SET status = 'available' WHERE datum = ? AND tid IN (${ph}) AND status = 'pending'`
  )
    .bind(b.datum, ...times)
    .run();
}

async function recordMembership(env: any, session: Stripe.Checkout.Session) {
  const email = session.customer_email || (session.metadata?.email ?? "");
  const namn = session.metadata?.namn || null;
  const amount = Number(session.metadata?.amount || 0);
  const customerId =
    typeof session.customer === "string" ? session.customer : null;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;
  if (!subscriptionId || !email) return;
  await env.DB.prepare(
    "INSERT INTO memberships (namn, email, amount, stripe_customer_id, stripe_subscription_id, status) VALUES (?, ?, ?, ?, ?, 'active') ON CONFLICT(stripe_subscription_id) DO UPDATE SET status = 'active'"
  )
    .bind(namn, email, amount, customerId, subscriptionId)
    .run();
}

export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  const stripe = getStripe(env);
  const sig = request.headers.get("stripe-signature") || "";
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (e) {
    console.error("Stripe webhook signaturfel:", e);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" || session.metadata?.type === "membership") {
        await recordMembership(env, session);
      } else if (session.metadata?.bookingId) {
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null;
        await finalizeBooking(env, session.metadata.bookingId, pi);
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.bookingId) {
        await releaseBooking(env, session.metadata.bookingId);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await env.DB.prepare(
        "UPDATE memberships SET status = 'cancelled' WHERE stripe_subscription_id = ?"
      )
        .bind(sub.id)
        .run();
    }
  } catch (e) {
    console.error("Fel vid hantering av webhook:", e);
  }

  return NextResponse.json({ received: true });
}
