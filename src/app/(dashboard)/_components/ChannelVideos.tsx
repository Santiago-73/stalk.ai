'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Video } from 'lucide-react'

interface Props {
  subjectId: string
  refreshKey?: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const thumbGradients = [
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #2d132c, #1a1a2e)',
  'linear-gradient(135deg, #1a2a1a, #0a1a0a)',
  'linear-gradient(135deg, #1a1a1a, #2a1a2a)',
  'linear-gradient(135deg, #0a1a2a, #1a0a2a)',
]

export default function ChannelVideos({ subjectId, refreshKey }: Props) {
  const [videos, setVideos] = useState<any[]>([])
  const [channelMap, setChannelMap] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      setLoading(true)
      const { data: channels } = await supabase
        .from('channels')
        .select('id, name, avg_views_per_video')
        .eq('subject_id', subjectId)

      if (!channels || channels.length === 0) {
        setLoading(false)
        return
      }

      const map = new Map(channels.map((c: any) => [c.id, c]))
      setChannelMap(map)

      const { data: vids } = await supabase
        .from('videos')
        .select('id, title, views, likes, published_at, thumbnail_url, channel_id')
        .in('channel_id', channels.map((c: any) => c.id))
        .order('published_at', { ascending: false })
        .limit(20)

      setVideos(vids ?? [])
      setLoading(false)
    }
    load()
  }, [subjectId, refreshKey])

  if (loading) return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      Loading videos...
    </div>
  )

  if (videos.length === 0) {
    return (
      <div style={{
        padding: '32px 20px', textAlign: 'center',
        background: 'var(--bg-card)', border: '1px dashed var(--border)',
        borderRadius: 14
      }}>
        <Video size={28} color="var(--text-muted)" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
          No videos yet
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Add channels above to start tracking their videos
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {videos.map((video, i) => {
        const ch = channelMap.get(video.channel_id)
        const avgViews = ch?.avg_views_per_video ?? video.views
        const multiplier = avgViews > 0 ? video.views / avgViews : 1
        const isHot = multiplier >= 3
        const isGood = multiplier >= 2

        return (
          <div key={video.id} className="hover-bg" style={{
            padding: '12px 20px',
            borderBottom: i < videos.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'grid', gridTemplateColumns: '80px 1fr auto auto',
            gap: 14, alignItems: 'center',
          }}>
            <div style={{
              width: 80, height: 46, borderRadius: 8, flexShrink: 0,
              background: video.thumbnail_url
                ? `url(${video.thumbnail_url}) center/cover`
                : thumbGradients[i % thumbGradients.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'rgba(255,255,255,0.3)',
            }}>
              {!video.thumbnail_url && '▶'}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {video.title}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {ch?.name ?? 'Channel'} · {timeAgo(video.published_at)}
              </div>
            </div>

            <span className="mono" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {fmt(video.views)}
            </span>

            {(isHot || isGood) ? (
              <span className="mono" style={{
                fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                padding: '3px 8px', borderRadius: 100,
                background: isHot ? 'rgba(255,92,92,0.12)' : 'rgba(16,185,129,0.12)',
                color: isHot ? '#ff7c7c' : '#10b981',
              }}>
                {isHot ? '🔥 ' : '↑ '}{multiplier.toFixed(1)}x avg
              </span>
            ) : <span />}
          </div>
        )
      })}
    </div>
  )
}
