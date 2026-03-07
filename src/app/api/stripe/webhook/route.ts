import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription

    switch (event.type) {
        case 'checkout.session.completed': {
            const checkoutSession = session as Stripe.Checkout.Session
            const userId = checkoutSession.metadata?.userId
            const plan = checkoutSession.metadata?.plan
            const customerId = checkoutSession.customer as string

            if (userId) {
                await supabaseAdmin.from('profiles').update({
                    stripe_customer_id: customerId,
                    plan: plan ?? 'pro'
                }).eq('id', userId)

                await supabaseAdmin.from('subscriptions').upsert({
                    user_id: userId,
                    stripe_subscription_id: checkoutSession.subscription as string,
                    status: 'active',
                    plan: plan ?? 'pro',
                })
            }
            break
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const sub = session as Stripe.Subscription
            const status = sub.status === 'active' ? 'active' : 'canceled'
            const plan = status === 'canceled' ? 'free' : sub.metadata?.plan ?? 'pro'

            await supabaseAdmin.from('subscriptions').update({
                status,
                current_period_end: new Date(sub.current_period_end * 1000).toISOString()
            }).eq('stripe_subscription_id', sub.id)

            // Update profile plan
            const { data: subRecord } = await supabaseAdmin
                .from('subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', sub.id)
                .single()

            if (subRecord?.user_id) {
                await supabaseAdmin.from('profiles').update({ plan }).eq('id', subRecord.user_id)
            }
            break
        }
    }

    return NextResponse.json({ received: true })
}
