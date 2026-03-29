import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's first subject (or create one)
  let { data: subjects } = await supabase
    .from('subjects')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  let subjectId: string

  if (subjects && subjects.length > 0) {
    subjectId = subjects[0].id
  } else {
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert({ name: 'Gaming Trends', description: 'Example subject — edit or delete anytime', user_id: user.id })
      .select('id')
      .single()
    if (error || !newSubject) return NextResponse.json({ error: error?.message ?? 'Failed to create subject' }, { status: 500 })
    subjectId = newSubject.id
  }

  const now = Date.now()

  // ── Channels ──────────────────────────────────────────────────────────
  const channelSeeds = [
    { platform: 'youtube', platform_channel_id: 'UCX6OQ3DkcsbYNE6H8uQQuVA', name: 'MrBeast', subscribers: 245_000_000, avg_views_per_video: 85_000_000, growth_rate_30d: 3 },
    { platform: 'youtube', platform_channel_id: 'UCBJycsmduvYEL83R_U4JriQ', name: 'MKBHD', subscribers: 19_200_000, avg_views_per_video: 4_500_000, growth_rate_30d: 2 },
    { platform: 'youtube', platform_channel_id: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw', name: 'PewDiePie', subscribers: 111_000_000, avg_views_per_video: 3_200_000, growth_rate_30d: 1 },
    { platform: 'youtube', platform_channel_id: 'SEED_noobish', name: 'NoobishPlays', subscribers: 34_200, avg_views_per_video: 54_000, growth_rate_30d: 42 },
    { platform: 'twitch', platform_channel_id: 'SEED_cozygamer', name: 'CozyGamerGirl', subscribers: 12_800, avg_views_per_video: 890, growth_rate_30d: 67 },
    { platform: 'youtube', platform_channel_id: 'SEED_retroruns', name: 'RetroRunsDaily', subscribers: 8_400, avg_views_per_video: 23_000, growth_rate_30d: 128 },
  ]

  const channelIds: Record<string, string> = {}

  for (const ch of channelSeeds) {
    const { data, error } = await supabase
      .from('channels')
      .upsert({
        subject_id: subjectId,
        user_id: user.id,
        platform: ch.platform,
        platform_channel_id: ch.platform_channel_id,
        name: ch.name,
        subscribers: ch.subscribers,
        avg_views_per_video: ch.avg_views_per_video,
        growth_rate_30d: ch.growth_rate_30d,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'platform,platform_channel_id,subject_id' })
      .select('id')
      .single()

    if (data) channelIds[ch.name] = data.id
    if (error) console.error(`Channel upsert error (${ch.name}):`, error.message)
  }

  // ── Channel Snapshots (30 days) ───────────────────────────────────────
  for (const ch of channelSeeds) {
    const chId = channelIds[ch.name]
    if (!chId) continue
    const snapshots = []
    for (let d = 29; d >= 0; d--) {
      const date = new Date(now - d * 86_400_000)
      const dayFactor = 1 - (d / 30) * 0.05
      snapshots.push({
        channel_id: chId,
        user_id: user.id,
        subscribers: Math.round(ch.subscribers * dayFactor),
        total_views: Math.round(ch.subscribers * 120 * dayFactor),
        snapshot_date: date.toISOString().split('T')[0],
      })
    }
    await supabase.from('channel_snapshots').upsert(snapshots, { onConflict: 'channel_id,snapshot_date' })
  }

  // ── Videos ────────────────────────────────────────────────────────────
  const videoSeeds = [
    { channel: 'NoobishPlays', platform_video_id: 'SEED_vid_1', title: 'I Played The New Update for 100 Hours...', views: 312_000, likes: 18_400, comments: 2_100, days_ago: 2 },
    { channel: 'MKBHD', platform_video_id: 'SEED_vid_2', title: 'Why Everyone Is Wrong About This Meta', views: 189_000, likes: 12_000, comments: 980, days_ago: 3 },
    { channel: 'NoobishPlays', platform_video_id: 'SEED_vid_3', title: 'Beginner to Pro in 30 Days Challenge', views: 97_000, likes: 6_800, comments: 540, days_ago: 1 },
    { channel: 'MrBeast', platform_video_id: 'SEED_vid_4', title: 'This Hidden Setting Changes Everything', views: 245_000_000, likes: 3_200_000, comments: 89_000, days_ago: 4 },
    { channel: 'RetroRunsDaily', platform_video_id: 'SEED_vid_5', title: 'Speedrunning This Game in Under 5 Minutes', views: 67_000, likes: 4_100, comments: 320, days_ago: 1 },
  ]

  for (const v of videoSeeds) {
    const chId = channelIds[v.channel]
    if (!chId) continue
    await supabase.from('videos').upsert({
      channel_id: chId,
      user_id: user.id,
      platform_video_id: v.platform_video_id,
      title: v.title,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      published_at: new Date(now - v.days_ago * 86_400_000).toISOString(),
      duration_seconds: 600 + Math.floor(Math.random() * 1200),
    }, { onConflict: 'platform_video_id' })
  }

  // ── Trends ────────────────────────────────────────────────────────────
  const trendSeeds = [
    { topic: 'Retro speedruns', source_platform: 'reddit', strength_score: 0.87, status: 'emerging', detail: '12 posts in r/speedrun this week (3x normal). Only 2 YouTube videos.', days_ago: 2 },
    { topic: 'AI voice cloning tools', source_platform: 'youtube', strength_score: 0.92, status: 'peak', detail: '8 channels covered this topic. Average 2.4x their normal views.', days_ago: 5 },
    { topic: 'Cozy game aesthetics', source_platform: 'twitch', strength_score: 0.65, status: 'emerging', detail: '3 streamers gained 40%+ followers this week with cozy content.', days_ago: 1 },
    { topic: 'Thumbnail face reactions', source_platform: 'youtube', strength_score: 0.45, status: 'declining', detail: 'Engagement dropping. Oversaturated — consider alternative styles.', days_ago: 14 },
  ]

  // Delete existing seeded trends first so insert is idempotent
  await supabase.from('trends').delete().eq('user_id', user.id).eq('subject_id', subjectId)
  await supabase.from('trends').insert(trendSeeds.map(t => ({
    user_id: user.id,
    subject_id: subjectId,
    topic: t.topic,
    source_platform: t.source_platform,
    strength_score: t.strength_score,
    status: t.status,
    detail: t.detail,
    first_detected_at: new Date(now - t.days_ago * 86_400_000).toISOString(),
  })))

  // ── Alerts ────────────────────────────────────────────────────────────
  const alertSeeds = [
    { type: 'viral_video', title: 'NoobishPlays video hit 5.8x average', message: '"I Played The New Update for 100 Hours" — 312K views vs 54K avg', hours_ago: 1, read: false },
    { type: 'emerging_trend', title: '"Retro speedruns" detected on Reddit', message: '3x normal activity in r/speedrun. Low YouTube competition.', hours_ago: 2, read: false },
    { type: 'new_channel', title: 'RetroRunsDaily growing +128% in 30d', message: 'New channel in your niche with anomalous growth pattern.', hours_ago: 4, read: true },
    { type: 'competitor_change', title: 'MKBHD changed upload frequency', message: 'Went from 1/week to 3/week. Views per video holding steady.', hours_ago: 8, read: true },
  ]

  // Delete existing seeded alerts and re-insert
  await supabase.from('alerts').delete().eq('user_id', user.id)
  const { error: alertError, data: alertData } = await supabase.from('alerts').insert(alertSeeds.map(a => ({
    user_id: user.id,
    subject_id: subjectId,
    type: a.type,
    title: a.title,
    message: a.message,
    read_at: a.read ? new Date().toISOString() : null,
  }))).select()

  return NextResponse.json({
    success: true,
    alertError: alertError?.message ?? null,
    alertsInserted: alertData?.length ?? 0,
    seeded: {
      channels: Object.keys(channelIds).length,
      videos: videoSeeds.length,
      trends: trendSeeds.length,
      alerts: alertSeeds.length,
    }
  })
}
