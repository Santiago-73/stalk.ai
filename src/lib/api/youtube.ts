/**
 * YouTube Data API v3 client
 * 
 * Quota budget: 10,000 units/day (free tier)
 * - search.list = 100 units
 * - channels.list = 1 unit  
 * - videos.list = 1 unit
 * - playlistItems.list = 1 unit
 * 
 * Strategy: cache aggressively in Supabase, sync in background
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

function getApiKey() {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY not set in environment')
  return key
}

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface YouTubeChannelData {
  platform_channel_id: string
  name: string
  avatar_url: string | null
  subscribers: number
  total_views: number
  description: string
  uploads_playlist_id: string
}

export interface YouTubeVideoData {
  platform_video_id: string
  title: string
  published_at: string
  views: number
  likes: number
  comments: number
  duration_seconds: number
  thumbnail_url: string | null
  tags: string[]
  category: string
}

/* ─── Channel operations ──────────────────────────────────────────────────── */

/**
 * Search for YouTube channels by keyword
 * Cost: 100 units per call — use sparingly!
 */
export async function searchChannels(query: string, maxResults = 5): Promise<{
  id: string
  name: string
  avatar_url: string | null
  subscribers: string
}[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: String(maxResults),
    key: getApiKey(),
  })

  const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(`YouTube search failed: ${error.error?.message ?? res.statusText}`)
  }

  const data = await res.json()
  const channelIds = (data.items ?? []).map((item: any) => item.snippet.channelId)

  if (channelIds.length === 0) return []

  // Get subscriber counts (costs 1 unit)
  const details = await getChannelDetails(channelIds)

  return details.map((ch) => ({
    id: ch.platform_channel_id,
    name: ch.name,
    avatar_url: ch.avatar_url,
    subscribers: formatCount(ch.subscribers),
  }))
}

/**
 * Get channel details by ID(s)
 * Cost: 1 unit
 */
export async function getChannelDetails(channelIds: string[]): Promise<YouTubeChannelData[]> {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: channelIds.join(','),
    key: getApiKey(),
  })

  const res = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(`YouTube channels.list failed: ${error.error?.message ?? res.statusText}`)
  }

  const data = await res.json()

  return (data.items ?? []).map((item: any) => ({
    platform_channel_id: item.id,
    name: item.snippet.title,
    avatar_url: item.snippet.thumbnails?.default?.url ?? null,
    subscribers: parseInt(item.statistics.subscriberCount ?? '0', 10),
    total_views: parseInt(item.statistics.viewCount ?? '0', 10),
    description: item.snippet.description ?? '',
    uploads_playlist_id: item.contentDetails?.relatedPlaylists?.uploads ?? '',
  }))
}

/**
 * Resolve a YouTube channel URL/handle to a channel ID
 * Supports: /channel/UC..., /@handle, /c/name, /user/name
 * Cost: 1 unit (or 100 if search fallback needed)
 */
export async function resolveChannelUrl(url: string): Promise<YouTubeChannelData | null> {
  const cleaned = url.trim().replace(/\/$/, '')

  // Direct channel ID: youtube.com/channel/UC...
  const channelIdMatch = cleaned.match(/\/channel\/(UC[\w-]+)/)
  if (channelIdMatch) {
    const details = await getChannelDetails([channelIdMatch[1]])
    return details[0] ?? null
  }

  // Handle: youtube.com/@handle
  const handleMatch = cleaned.match(/@([\w.-]+)/)
  if (handleMatch) {
    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      forHandle: handleMatch[1],
      key: getApiKey(),
    })
    const res = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.items?.length) return null
    const item = data.items[0]
    return {
      platform_channel_id: item.id,
      name: item.snippet.title,
      avatar_url: item.snippet.thumbnails?.default?.url ?? null,
      subscribers: parseInt(item.statistics.subscriberCount ?? '0', 10),
      total_views: parseInt(item.statistics.viewCount ?? '0', 10),
      description: item.snippet.description ?? '',
      uploads_playlist_id: item.contentDetails?.relatedPlaylists?.uploads ?? '',
    }
  }

  // /c/name or /user/name — fallback to search (100 units)
  const nameMatch = cleaned.match(/\/(c|user)\/([\w.-]+)/)
  if (nameMatch) {
    const results = await searchChannels(nameMatch[2], 1)
    if (results.length === 0) return null
    const details = await getChannelDetails([results[0].id])
    return details[0] ?? null
  }

  // Last resort: treat the whole string as a search query
  const results = await searchChannels(cleaned, 1)
  if (results.length === 0) return null
  const details = await getChannelDetails([results[0].id])
  return details[0] ?? null
}

/* ─── Video operations ────────────────────────────────────────────────────── */

/**
 * Get latest videos from a channel's uploads playlist
 * Cost: 1 unit for playlistItems + 1 unit for video details = 2 units total
 */
export async function getLatestVideos(
  uploadsPlaylistId: string,
  maxResults = 20
): Promise<YouTubeVideoData[]> {
  // Step 1: Get video IDs from playlist (1 unit)
  const playlistParams = new URLSearchParams({
    part: 'contentDetails',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
    key: getApiKey(),
  })

  const playlistRes = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${playlistParams}`)
  if (!playlistRes.ok) {
    const error = await playlistRes.json()
    throw new Error(`YouTube playlistItems failed: ${error.error?.message ?? playlistRes.statusText}`)
  }

  const playlistData = await playlistRes.json()
  const videoIds = (playlistData.items ?? []).map(
    (item: any) => item.contentDetails.videoId
  )

  if (videoIds.length === 0) return []

  // Step 2: Get video details (1 unit)
  return getVideoDetails(videoIds)
}

/**
 * Get video details by ID(s)
 * Cost: 1 unit
 */
export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoData[]> {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
    key: getApiKey(),
  })

  const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(`YouTube videos.list failed: ${error.error?.message ?? res.statusText}`)
  }

  const data = await res.json()

  return (data.items ?? []).map((item: any) => ({
    platform_video_id: item.id,
    title: item.snippet.title,
    published_at: item.snippet.publishedAt,
    views: parseInt(item.statistics.viewCount ?? '0', 10),
    likes: parseInt(item.statistics.likeCount ?? '0', 10),
    comments: parseInt(item.statistics.commentCount ?? '0', 10),
    duration_seconds: parseDuration(item.contentDetails.duration),
    thumbnail_url: item.snippet.thumbnails?.maxres?.url
      ?? item.snippet.thumbnails?.high?.url
      ?? item.snippet.thumbnails?.medium?.url
      ?? null,
    tags: item.snippet.tags ?? [],
    category: item.snippet.categoryId ?? '',
  }))
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] ?? '0', 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  const seconds = parseInt(match[3] ?? '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
