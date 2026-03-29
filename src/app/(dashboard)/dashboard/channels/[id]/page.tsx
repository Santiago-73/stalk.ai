import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Users, Play, TrendingUp, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import ChannelChart from './ChannelChart'

function formatNum(n: number) {
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

const platformColor: Record<string, string> = {
  youtube: '#ff4444',
  twitch: '#9146ff',
}
const platformLabel: Record<string, string> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
}

const thumbGradients = [
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #2d132c, #1a1a2e)',
  'linear-gradient(135deg, #1a2a1a, #0a1a0a)',
  'linear-gradient(135deg, #1a1a1a, #2a1a2a)',
  'linear-gradient(135deg, #0a1a2a, #1a0a2a)',
]

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: channel } = await supabase
    .from('channels')
    .select('*, subjects(name)')
    .eq('id', id)
    .eq('user_id', user?.id ?? '')
    .single()

  if (!channel) notFound()

  const [{ data: snapshotsRaw }, { data: videosRaw }] = await Promise.all([
    supabase
      .from('channel_snapshots')
      .select('snapshot_date, subscribers, total_views, avg_views')
      .eq('channel_id', id)
      .order('snapshot_date', { ascending: true })
      .limit(30),
    supabase
      .from('videos')
      .select('id, title, views, published_at, thumbnail_url')
      .eq('channel_id', id)
      .order('published_at', { ascending: false })
      .limit(12),
  ])

  const snapshots = snapshotsRaw ?? []
  const videos = videosRaw ?? []

  const color = platformColor[channel.platform] ?? '#7c3aed'
  const growth = channel.growth_rate_30d ?? 0

  const stats = [
    { label: 'Subscribers', value: formatNum(channel.subscribers ?? 0), icon: <Users size={16} />, color: '#7c3aed' },
    { label: 'Avg Views/Video', value: formatNum(channel.avg_views_per_video ?? 0), icon: <Play size={16} />, color: '#ff4444' },
    { label: '30d Growth', value: `${growth > 0 ? '+' : ''}${growth}%`, icon: <TrendingUp size={16} />, color: growth > 0 ? '#10b981' : growth < 0 ? '#ef4444' : 'var(--text-muted)' },
    { label: 'Videos Synced', value: videos.length, icon: <Calendar size={16} />, color: '#f59e0b' },
  ]

  return (
    <div>
      {/* Back */}
      <Link href="/dashboard/channels" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none',
        marginBottom: 24, transition: 'color 0.15s',
      }}
        className="back-link"
      >
        <ArrowLeft size={15} /> Back to Channels
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, flexShrink: 0,
          background: channel.avatar_url ? `url(${channel.avatar_url}) center/cover` : `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 26, fontWeight: 800,
          border: `2px solid ${color}33`,
        }}>
          {!channel.avatar_url && channel.name.charAt(0)}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{channel.name}</h1>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              background: `${color}18`, color,
            }}>
              {platformLabel[channel.platform] ?? channel.platform}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            {(channel.subjects as any)?.name && (
              <Link href={`/dashboard/subjects/${channel.subject_id}`} style={{
                color: 'var(--accent-bright)', textDecoration: 'none', fontSize: 13,
              }}>
                {(channel.subjects as any).name}
              </Link>
            )}
            {channel.last_synced_at && (
              <span>Last synced {timeAgo(channel.last_synced_at)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="channel-detail-stats" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28
      }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `${s.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '24px', marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Growth Over Time</h2>
        <ChannelChart snapshots={snapshots} />
      </div>

      {/* Recent videos */}
      {videos.length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Videos</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14
          }}>
            {videos.map((v, i) => {
              const multiplier = (channel.avg_views_per_video ?? 0) > 0
                ? v.views / channel.avg_views_per_video
                : 1
              const isViral = multiplier >= 5
              const isHot = multiplier >= 2
              const perfColor = isViral ? '#ff7c7c' : isHot ? '#10b981' : '#f59e0b'

              return (
                <div key={v.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    width: '100%', aspectRatio: '16/9',
                    background: v.thumbnail_url
                      ? `url(${v.thumbnail_url}) center/cover`
                      : thumbGradients[i % thumbGradients.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: 'rgba(255,255,255,0.3)',
                  }}>
                    {!v.thumbnail_url && '▶'}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      marginBottom: 8,
                    }}>
                      {v.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
                        {formatNum(v.views)} views
                      </span>
                      {(isViral || isHot) && (
                        <span className="mono" style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                          background: `${perfColor}18`, color: perfColor,
                        }}>
                          {isViral ? '🔥 ' : '↑ '}{multiplier.toFixed(1)}x
                        </span>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {timeAgo(v.published_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
