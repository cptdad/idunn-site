import { getStripe } from "@/lib/stripe";

// Återbetalar en (del av en) betald bokning via Stripe.
// fraction 1 = full återbetalning, 0.5 = hälften (t.ex. sen avbokning).
export async function refundBooking(
  env: any,
  booking: { stripe_payment_intent?: string | null; amount?: number | null },
  fraction: number
): Promise<boolean> {
  if (!booking?.stripe_payment_intent || !booking.amount) return false;
  const amountOre = Math.round(booking.amount * 100 * fraction);
  if (amountOre <= 0) return false;
  try {
    const stripe = getStripe(env);
    await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent,
      amount: amountOre,
    });
    return true;
  } catch (e) {
    console.error("Refund-fel:", e);
    return false;
  }
}

// Timmar kvar till besöket (datum "YYYY-MM-DD", tid "HH:MM").
export function hoursUntil(datum: string, tid: string): number {
  const when = new Date(`${datum}T${tid}:00`).getTime();
  return (when - Date.now()) / 3600000;
}
