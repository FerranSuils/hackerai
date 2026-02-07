import Stripe from "stripe";

let _stripe: Stripe | undefined;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

// Lazy proxy: initialized on first property access at runtime, not at import time.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});
