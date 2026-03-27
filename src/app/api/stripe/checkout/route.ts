import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const plan = request.nextUrl.searchParams.get('plan') as 'pro' | 'ultra' | null
    if (!plan || !(plan in PLANS) || !PLANS[plan as keyof typeof PLANS]?.priceId) {
        console.error('Stripe Checkout: invalid plan or missing priceId env var', { plan, priceId: PLANS[plan as keyof typeof PLANS]?.priceId })
        return NextResponse.json({ error: 'Invalid plan or price not configured' }, { status: 400 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: profile?.stripe_customer_id || undefined,
            customer_email: !profile?.stripe_customer_id ? user.email : undefined,
            line_items: [{ price: PLANS[plan as keyof typeof PLANS].priceId!, quantity: 1 }],
            success_url: `${appUrl}/settings?success=true`,
            cancel_url: `${appUrl}/settings?canceled=true`,
            metadata: { userId: user.id, plan },
        })

        return NextResponse.redirect(session.url!)
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
    }
}
