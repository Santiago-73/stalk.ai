import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
})

export const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        priceId: null,
        features: ['5 sources', 'Weekly digest', 'YouTube + Reddit + RSS'],
    },
    pro: {
        name: 'Pro',
        price: 9,
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        features: ['50 sources', 'Daily digest', 'Email alerts', 'AI summaries'],
    },
    ultra: {
        name: 'Ultra',
        price: 19,
        priceId: process.env.STRIPE_ULTRA_PRICE_ID,
        features: ['Unlimited sources', 'Real-time alerts', 'Custom digest schedule', 'Priority support'],
    },
}
