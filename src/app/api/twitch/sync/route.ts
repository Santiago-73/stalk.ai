import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getTwitchToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Twitch credentials not configured')

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel_id, subject_id } = await req.json()
  if (!channel_id || !subject_id) {
    return NextResponse.json({ error: 'channel_id and subject_id required' }, { status: 400 })
  }

  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subject_id)
    .eq('user_id', user.id)
    .single()
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    const token = await getTwitchToken()

    // Get channel info + follower count in parallel
    const [userRes, followersRes] = await Promise.all([
      fetch(`https://api.twitch.tv/helix/users?id=${channel_id}`, {
        headers: { 'Client-Id': clientId!, 'Authorization': `Bearer ${token}` }
      }),
      fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${channel_id}&first=1`, {
        headers: { 'Client-Id': clientId!, 'Authorization': `Bearer ${token}` }
      }),
    ])

    const userData = await userRes.json()
    const followersData = await followersRes.json()

    const twitchUser = userData.data?.[0]
    if (!twitchUser) return NextResponse.json({ error: 'Channel not found on Twitch' }, { status: 404 })

    const followerCount: number = followersData.total ?? 0
    const channelName: string = twitchUser.display_name
    const avatarUrl: string | null = twitchUser.profile_image_url || null

    // Upsert into channels table
    const { data: channelRow, error: upsertError } = await supabase
      .from('channels')
      .upsert({
        subject_id,
        user_id: user.id,
        platform: 'twitch',
        platform_channel_id: channel_id,
        name: channelName,
        avatar_url: avatarUrl,
        subscribers: followerCount,
        avg_views_per_video: 0,
        growth_rate_30d: 0,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'subject_id,platform_channel_id' })
      .select('id')
      .single()

    if (upsertError) {
      console.error('Twitch channel upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    // Also save to sources table
    await supabase.from('sources').upsert({
      subject_id,
      user_id: user.id,
      type: 'twitch',
      name: channelName,
      url: `https://www.twitch.tv/${twitchUser.login}`,
    }, { onConflict: 'subject_id,url' })

    return NextResponse.json({
      success: true,
      channel: { id: channelRow?.id, name: channelName, followers: followerCount },
    })
  } catch (err: any) {
    console.error('Twitch sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
