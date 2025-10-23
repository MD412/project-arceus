import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export const STRIPE_CONFIG = {
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
  cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
};

export async function createCheckoutSession({
  priceId,
  customerId,
  userId,
}: {
  priceId: string;
  customerId?: string;
  userId: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    metadata: {
      userId,
    },
    success_url: STRIPE_CONFIG.successUrl,
    cancel_url: STRIPE_CONFIG.cancelUrl,
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  });

  return session;
}
