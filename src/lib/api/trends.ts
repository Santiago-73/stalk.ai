import { SupabaseClient } from '@supabase/supabase-js'

// ── Gemini (same pattern as daily-digest) ────────────────────────────────────

async function geminiGenerate(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY_PAID
    || process.env.GOOGLE_GEMINI_API_KEY
    || process.env.GOOGLE_GEMINI_API_KEY_FREE
  if (!apiKey) throw new Error('No Gemini API key configured')

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
  let lastErr = ''
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(45000),
      }
    )
    if (res.status === 404) { lastErr = `${model} not found`; continue }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
    const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (text) return text
  }
  throw new Error(`No working Gemini model. Last: ${lastErr}`)
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface VideoForAnalysis {
  title: string
  views: number
  avg_channel_views: number
  performance_ratio: number
  tags: string[]
  published_at: string
  channel_name: string
}

export interface DetectedTrend {
  topic: string
  source_platform: string
  strength_score: number
  status: 'emerging' | 'peak' | 'declining'
  detail: string
  metadata: {
    related_videos: string[]
    video_count: number
    avg_performance: number
  }
}

// ── Core AI detection ────────────────────────────────────────────────────────

export async function detectTrends(videos: VideoForAnalysis[]): Promise<DetectedTrend[]> {
  const prompt = `You are a trend detection AI for content creators. Analyze these YouTube videos from a specific niche and identify trending topics.

For each video you have: title, views, performance_ratio (views vs channel average, >2x means outperforming), tags, publish date, and channel name.

VIDEOS DATA:
${JSON.stringify(videos, null, 2)}

YOUR TASK:
1. Identify 3-8 trending TOPICS (not individual videos) based on:
   - Topics that appear in multiple videos across different channels
   - Topics where videos are outperforming (performance_ratio > 2x)
   - Topics that are recent (published in last 7-14 days)
   - Common themes, formats, or angles that are working

2. For each topic, determine:
   - topic: short name (2-5 words)
   - strength_score: 0.0-1.0 (based on frequency, performance and recency)
   - status: "emerging" (new, growing), "peak" (high activity now), or "declining" (was popular, fading)
   - detail: one sentence explaining WHY this is trending and what a creator should do about it
   - related_videos: list of video titles that contribute to this trend
   - video_count: how many videos relate to this trend
   - avg_performance: average performance_ratio of related videos

3. Focus on ACTIONABLE insights. Don't just list topics — explain what's working and why.

Respond ONLY with a JSON array, no markdown, no explanation:
[
  {
    "topic": "...",
    "strength_score": 0.85,
    "status": "emerging",
    "detail": "...",
    "related_videos": ["...", "..."],
    "video_count": 3,
    "avg_performance": 2.4
  }
]`

  let raw = ''
  try {
    raw = await geminiGenerate(prompt)
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((t: any) => t.topic && typeof t.strength_score === 'number')
      .map((t: any): DetectedTrend => ({
        topic: String(t.topic).slice(0, 100),
        source_platform: 'youtube',
        strength_score: Math.max(0, Math.min(1, Number(t.strength_score))),
        status: ['emerging', 'peak', 'declining'].includes(t.status) ? t.status : 'emerging',
        detail: String(t.detail ?? '').slice(0, 500),
        metadata: {
          related_videos: Array.isArray(t.related_videos) ? t.related_videos.slice(0, 10) : [],
          video_count: Number(t.video_count ?? 0),
          avg_performance: Number(t.avg_performance ?? 0),
        },
      }))
  } catch (err) {
    console.error('Trend parsing error:', err, '\nRaw:', raw.slice(0, 500))
    return []
  }
}

// ── Subject-level detection (shared by /detect and /detect-all) ──────────────

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export async function detectTrendsForSubject(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string
): Promise<{ trendsDetected: number; alertsCreated: number; videosAnalyzed: number; error?: string }> {
  // 1. Get channels for this subject
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name, avg_views_per_video')
    .eq('subject_id', subjectId)
    .eq('user_id', userId)

  if (!channels || channels.length === 0) {
    return { trendsDetected: 0, alertsCreated: 0, videosAnalyzed: 0, error: 'No channels found for this subject' }
  }

  const channelIds = channels.map(c => c.id)
  const channelMap = new Map(channels.map(c => [c.id, c]))

  // 2. Get recent videos (no !inner join)
  const { data: videos } = await supabase
    .from('videos')
    .select('id, title, views, tags, published_at, channel_id')
    .in('channel_id', channelIds)
    .gte('published_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .order('published_at', { ascending: false })
    .limit(100)

  if (!videos || videos.length < 3) {
    return {
      trendsDetected: 0, alertsCreated: 0, videosAnalyzed: videos?.length ?? 0,
      error: 'Need at least 3 recent videos to detect trends. Sync more channels first.',
    }
  }

  // 3. Build VideoForAnalysis array
  const videosForAnalysis: VideoForAnalysis[] = videos.map(v => {
    const ch = channelMap.get(v.channel_id)
    const avg = ch?.avg_views_per_video ?? 0
    return {
      title: v.title,
      views: v.views ?? 0,
      avg_channel_views: avg,
      performance_ratio: avg > 0 ? Math.round((v.views / avg) * 10) / 10 : 1,
      tags: v.tags ?? [],
      published_at: v.published_at,
      channel_name: ch?.name ?? 'Unknown',
    }
  })

  // 4. Call AI
  const detectedTrends = await detectTrends(videosForAnalysis)

  // 5. Mark old trends as dead
  await supabase
    .from('trends')
    .update({ status: 'dead', updated_at: new Date().toISOString() })
    .eq('subject_id', subjectId)
    .eq('user_id', userId)
    .neq('status', 'dead')

  // 6. Insert new trends
  let trendsDetected = 0
  if (detectedTrends.length > 0) {
    const { error: insertError } = await supabase.from('trends').insert(
      detectedTrends.map(t => ({
        subject_id: subjectId,
        user_id: userId,
        topic: t.topic,
        source_platform: t.source_platform,
        strength_score: t.strength_score,
        status: t.status,
        detail: t.detail,
        metadata: t.metadata,
        first_detected_at: new Date().toISOString(),
      }))
    )
    if (!insertError) trendsDetected = detectedTrends.length
    else console.error('Trends insert error:', insertError)
  }

  // 7. Alerts for strong trends
  let alertsCreated = 0
  const strongTrends = detectedTrends.filter(t => t.strength_score > 0.7)
  if (strongTrends.length > 0) {
    await supabase.from('alerts').insert(
      strongTrends.map(t => ({
        subject_id: subjectId,
        user_id: userId,
        type: 'emerging_trend',
        title: `"${t.topic}" detected as ${t.status}`,
        message: t.detail,
        data: { strength: t.strength_score, video_count: t.metadata.video_count },
      }))
    )
    alertsCreated += strongTrends.length
  }

  // 8. Alerts for viral videos
  const viralVideos = videosForAnalysis.filter(v => v.performance_ratio >= 3)
  if (viralVideos.length > 0) {
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('title')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .eq('type', 'viral_video')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

    const existingTitles = new Set((existingAlerts ?? []).map((a: any) => a.title))

    const viralAlerts = viralVideos
      .filter(v => {
        const t = `${v.channel_name} video hit ${v.performance_ratio}x average`
        return !existingTitles.has(t)
      })
      .slice(0, 3)
      .map(v => ({
        subject_id: subjectId,
        user_id: userId,
        type: 'viral_video',
        title: `${v.channel_name} video hit ${v.performance_ratio}x average`,
        message: `"${v.title}" — ${formatViews(v.views)} views vs ${formatViews(v.avg_channel_views)} avg`,
        data: { views: v.views, performance_ratio: v.performance_ratio },
      }))

    if (viralAlerts.length > 0) {
      await supabase.from('alerts').insert(viralAlerts)
      alertsCreated += viralAlerts.length
    }
  }

  return { trendsDetected, alertsCreated, videosAnalyzed: videosForAnalysis.length }
}
