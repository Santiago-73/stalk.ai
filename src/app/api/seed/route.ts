import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const EXAMPLE_SOURCES = [
    { name: 'MrBeast Gaming', url: 'https://www.youtube.com/@MrBeastGaming' },
    { name: 'Markiplier', url: 'https://www.youtube.com/@Markiplier' },
    { name: 'jacksepticeye', url: 'https://www.youtube.com/@jacksepticeye' },
]

export async function POST() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Skip if already seeded
    if (user.user_metadata?.example_seeded) {
        return NextResponse.json({ skipped: true })
    }

    // Skip if user already has subjects
    const { count } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    if ((count ?? 0) > 0) {
        return NextResponse.json({ skipped: true })
    }

    // Create example subject
    const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .insert({
            name: 'Gaming Trends 🎮',
            description: 'Example subject — edit it or delete anytime',
            user_id: user.id,
        })
        .select()
        .single()

    if (subjectError || !subject) {
        return NextResponse.json({ error: subjectError?.message }, { status: 500 })
    }

    // Insert sources
    await supabase.from('sources').insert(
        EXAMPLE_SOURCES.map(src => ({
            name: src.name,
            type: 'youtube',
            url: src.url,
            user_id: user.id,
            subject_id: subject.id,
        }))
    )

    // Mark as seeded via admin client so it persists even if user deletes the subject
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, example_seeded: true },
    })

    return NextResponse.json({ created: true, subjectId: subject.id })
}
