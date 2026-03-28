import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)

        // Ensure profile exists (trigger may not fire for OAuth users)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('profiles').upsert(
                { id: user.id, email: user.email },
                { onConflict: 'id', ignoreDuplicates: true }
            )
        }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
