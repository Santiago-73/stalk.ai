import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SOURCE_LIMITS: Record<string, number> = {
    free: 3,
    pro: 15,
    ultra: Infinity,
}

export async function POST(req: NextRequest) {
    try {
        const { name, type, url, subject_id } = await req.json()
        if (!name || !type || !url || !subject_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get user plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single()
        const plan = profile?.plan ?? 'free'
        const limit = SOURCE_LIMITS[plan] ?? 3

        // Count existing sources for this subject
        const { count } = await supabase
            .from('sources')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject_id)
            .eq('user_id', user.id)

        if (limit !== Infinity && (count ?? 0) >= limit) {
            return NextResponse.json(
                { error: `Source limit reached. Your ${plan} plan allows up to ${limit} sources per subject.`, limit_reached: true, plan },
                { status: 429 }
            )
        }

        // Insert source
        const { data, error } = await supabase
            .from('sources')
            .insert({ name: name.trim(), type, url: url.trim(), user_id: user.id, subject_id })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true, source: data })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
    }
}
