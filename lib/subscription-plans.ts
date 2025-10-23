export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  limits: {
    maxCards: number;
    aiIdentification: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with your collection',
    price: 0,
    currency: 'usd',
    interval: 'month',
    stripePriceId: '', // No Stripe price ID for free tier
    features: [
      'Up to 100 cards',
      'Basic collection tracking',
      'Card search and filtering',
      'Mobile-friendly interface'
    ],
    limits: {
      maxCards: 100,
      aiIdentification: false,
      advancedAnalytics: false,
      exportData: false
    }
  },
  {
    id: 'pro',
    name: 'Arceus Pro',
    description: 'Unlimited collection management with AI-powered features',
    price: 7.77,
    currency: 'usd',
    interval: 'month',
    stripePriceId: '', // You'll get this from Stripe dashboard
    features: [
      'Unlimited card storage',
      'AI-powered card identification',
      'Advanced search & filters',
      'Collection analytics',
      'Data export',
      'Priority support'
    ],
    limits: {
      maxCards: -1, // Unlimited
      aiIdentification: true,
      advancedAnalytics: true,
      exportData: true
    }
  }
];

export const getPlanById = (id: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
};

export const getPlanByStripePriceId = (stripePriceId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.stripePriceId === stripePriceId);
};
