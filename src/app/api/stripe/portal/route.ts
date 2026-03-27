import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

    if (!profile?.stripe_customer_id) {
        return NextResponse.redirect(new URL('/settings', request.url))
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/settings`

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: returnUrl,
        })
        return NextResponse.redirect(session.url)
    } catch (error: any) {
        console.error('Stripe Portal Error:', error)
        // Portal not configured or customer invalid — redirect back to settings
        return NextResponse.redirect(new URL('/settings?portal_error=true', request.url))
    }
}
