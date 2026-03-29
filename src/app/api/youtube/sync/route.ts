import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveChannelUrl, getLatestVideos } from '@/lib/api/youtube'

/**
 * POST /api/youtube/sync
 * 
 * Body: { url: string, subject_id: string }
 * 
 * Resolves a YouTube channel URL, saves/updates the channel in DB,
 * fetches latest videos and saves them.
 * 
 * Quota cost: ~4 units (1 resolve + 1 playlist + 1 video details + 1 channel details)
 * Exception: if URL needs search fallback, costs 100 extra units.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { url, subject_id } = body

    if (!url || !subject_id) {
      return NextResponse.json(
        { error: 'Missing required fields: url, subject_id' },
        { status: 400 }
      )
    }

    // Verify user owns the subject
    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subject_id)
      .eq('user_id', user.id)
      .single()

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Resolve the YouTube URL to channel data
    const channelData = await resolveChannelUrl(url)
    if (!channelData) {
      return NextResponse.json(
        { error: 'Could not find YouTube channel for this URL' },
        { status: 404 }
      )
    }

    // Upsert channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .upsert({
        subject_id,
        user_id: user.id,
        platform: 'youtube',
        platform_channel_id: channelData.platform_channel_id,
        name: channelData.name,
        avatar_url: channelData.avatar_url,
        subscribers: channelData.subscribers,
        total_views: channelData.total_views,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'platform,platform_channel_id,subject_id',
      })
      .select('id')
      .single()

    if (channelError) {
      console.error('Channel upsert error:', channelError)
      return NextResponse.json(
        { error: 'Failed to save channel' },
        { status: 500 }
      )
    }

    // Also save as a source so it appears in the subject's source list
    await supabase.from('sources').upsert({
      subject_id,
      user_id: user.id,
      type: 'youtube',
      name: channelData.name,
      url: `https://www.youtube.com/channel/${channelData.platform_channel_id}`,
    }, { onConflict: 'subject_id,url' })

    // Save a daily snapshot
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('channel_snapshots')
      .upsert({
        channel_id: channel.id,
        user_id: user.id,
        subscribers: channelData.subscribers,
        total_views: channelData.total_views,
        snapshot_date: today,
      }, {
        onConflict: 'channel_id,snapshot_date',
      })

    // Fetch latest videos
    let videoCount = 0
    if (channelData.uploads_playlist_id) {
      const videos = await getLatestVideos(channelData.uploads_playlist_id, 20)

      // Calculate avg views for the channel
      const avgViews = videos.length > 0
        ? Math.round(videos.reduce((sum: number, v) => sum + v.views, 0) / videos.length)
        : 0

      // Update channel with avg views
      await supabase
        .from('channels')
        .update({ avg_views_per_video: avgViews })
        .eq('id', channel.id)

      // Upsert videos
      for (const video of videos) {
        const { error: videoError } = await supabase
          .from('videos')
          .upsert({
            channel_id: channel.id,
            user_id: user.id,
            platform_video_id: video.platform_video_id,
            title: video.title,
            published_at: video.published_at,
            views: video.views,
            likes: video.likes,
            comments: video.comments,
            duration_seconds: video.duration_seconds,
            thumbnail_url: video.thumbnail_url,
            tags: video.tags,
            category: video.category,
          }, {
            onConflict: 'platform_video_id',
          })

        if (!videoError) videoCount++
      }
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        name: channelData.name,
        subscribers: channelData.subscribers,
        total_views: channelData.total_views,
        avatar_url: channelData.avatar_url,
      },
      videos_synced: videoCount,
    })

  } catch (error) {
    console.error('YouTube sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
