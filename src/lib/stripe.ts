import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
})

export const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        priceId: null,
        features: ['3 subjects', '3 sources per subject', 'YouTube only', '1 manual digest per day'],
    },
    pro: {
        name: 'Pro',
        price: 9,
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        features: ['50 subjects', '15 sources per subject', 'YouTube + Reddit + Twitch', 'Daily digest by email', 'Unlimited generations'],
    },
    ultra: {
        name: 'Ultra',
        price: 19,
        priceId: process.env.STRIPE_ULTRA_PRICE_ID,
        features: ['Unlimited subjects & sources', 'All Pro features', 'Deep Video Analysis (Gemini 2.5)', 'Priority support'],
    },
}
