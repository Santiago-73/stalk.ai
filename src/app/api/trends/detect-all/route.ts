import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectTrendsForSubject } from '@/lib/api/trends'

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', user.id)

  let totalTrends = 0
  let subjectsProcessed = 0
  const results: { subject: string; trends: number; error?: string }[] = []

  for (const subject of (subjects ?? [])) {
    const { count } = await supabase
      .from('channels')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subject.id)

    if ((count ?? 0) === 0) continue

    const result = await detectTrendsForSubject(supabase, user.id, subject.id)
    totalTrends += result.trendsDetected
    subjectsProcessed++
    results.push({ subject: subject.name, trends: result.trendsDetected, error: result.error })
  }

  return NextResponse.json({
    success: true,
    subjects_processed: subjectsProcessed,
    total_trends: totalTrends,
    results,
  })
}
