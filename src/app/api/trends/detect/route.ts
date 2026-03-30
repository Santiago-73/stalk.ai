import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectTrendsForSubject } from '@/lib/api/trends'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject_id } = await req.json()
  if (!subject_id) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', subject_id)
    .eq('user_id', user.id)
    .single()

  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  const result = await detectTrendsForSubject(supabase, user.id, subject_id)

  if (result.error && result.videosAnalyzed < 3) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    subject: subject.name,
    videos_analyzed: result.videosAnalyzed,
    trends_detected: result.trendsDetected,
    alerts_created: result.alertsCreated,
  })
}
