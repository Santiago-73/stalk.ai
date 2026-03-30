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

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })

  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    const token = await getTwitchToken()

    const res = await fetch(
      `https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(q)}&first=8`,
      { headers: { 'Client-Id': clientId!, 'Authorization': `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`Twitch search error: ${res.status}`)
    const data = await res.json()

    // Get follower counts in parallel (batch: up to 8 channels)
    const ids = (data.data ?? []).map((c: any) => c.id)
    let followerMap: Map<string, number> = new Map()

    if (ids.length > 0) {
      // Helix /channels/followers requires one request per broadcaster_id
      // Use /users endpoint to get profile images, then followers batch where possible
      const followersRes = await Promise.allSettled(
        ids.slice(0, 5).map((id: string) =>
          fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${id}&first=1`, {
            headers: { 'Client-Id': clientId!, 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()).then(d => ({ id, total: d.total ?? 0 }))
        )
      )
      for (const r of followersRes) {
        if (r.status === 'fulfilled') followerMap.set(r.value.id, r.value.total)
      }
    }

    const results = (data.data ?? []).map((ch: any) => ({
      id: ch.id,
      platform_channel_id: ch.id,
      name: ch.display_name,
      avatar_url: ch.thumbnail_url || null,
      followers: followerMap.get(ch.id) ?? 0,
      is_live: ch.is_live,
      game: ch.game_name || null,
    }))

    return NextResponse.json({ results })
  } catch (err: any) {
    console.error('Twitch search error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
