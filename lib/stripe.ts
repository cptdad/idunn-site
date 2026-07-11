import Stripe from "stripe";

// Stripe-klient anpassad för Cloudflare Workers (fetch-baserad http-klient).
export function getStripe(env: any): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}
