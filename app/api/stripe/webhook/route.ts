import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/bookingEmails";

export const dynamic = "force-dynamic";

async function finalizeBooking(env: any, bookingId: string) {
  const b: any = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?")
    .bind(bookingId)
    .first();
  if (!b || b.status !== "pending") return; // idempotent
  await env.DB.prepare("UPDATE bookings SET status = 'active' WHERE id = ?")
    .bind(bookingId)
    .run();
  if (b.slot_id) {
    await env.DB.prepare("UPDATE slots SET status = 'booked' WHERE id = ?")
      .bind(b.slot_id)
      .run();
  }
  await sendBookingConfirmation(env, b);
}

async function releaseBooking(env: any, bookingId: string) {
  const b: any = await env.DB.prepare(
    "SELECT slot_id, status FROM bookings WHERE id = ?"
  )
    .bind(bookingId)
    .first();
  if (!b || b.status !== "pending") return;
  await env.DB.prepare("UPDATE bookings SET status = 'expired' WHERE id = ?")
    .bind(bookingId)
    .run();
  if (b.slot_id) {
    await env.DB.prepare(
      "UPDATE slots SET status = 'available' WHERE id = ? AND status = 'pending'"
    )
      .bind(b.slot_id)
      .run();
  }
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
      const bookingId = session.metadata?.bookingId;
      if (bookingId) await finalizeBooking(env, bookingId);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) await releaseBooking(env, bookingId);
    }
  } catch (e) {
    console.error("Fel vid hantering av webhook:", e);
  }

  return NextResponse.json({ received: true });
}
