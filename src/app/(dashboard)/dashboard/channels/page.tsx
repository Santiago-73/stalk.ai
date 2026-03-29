import { createClient } from '@/lib/supabase/server'
import { Users, Play, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function formatViews(n: number) {
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

export default async function ChannelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  const { data: channels } = await supabase
    .from('channels')
    .select('*, subjects(name)')
    .eq('user_id', userId)
    .order('subscribers', { ascending: false })

  const channelList = channels ?? []
  const channelIds = channelList.map(c => c.id)

  // Video counts per channel
  let videoCounts: Record<string, number> = {}
  let topVideos: any[] = []

  if (channelIds.length > 0) {
    const { data: vids } = await supabase
      .from('videos')
      .select('channel_id')
      .in('channel_id', channelIds)

    for (const v of (vids ?? [])) {
      videoCounts[v.channel_id] = (videoCounts[v.channel_id] ?? 0) + 1
    }

    // Top videos last 30 days (no join — enrich manually)
    const { data: topVidsRaw } = await supabase
      .from('videos')
      .select('id, title, views, published_at, thumbnail_url, channel_id')
      .in('channel_id', channelIds)
      .gte('published_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
      .order('views', { ascending: false })
      .limit(10)

    const channelMap = new Map(channelList.map(c => [c.id, c]))
    topVideos = (topVidsRaw ?? []).map(v => ({
      ...v,
      channel_name: channelMap.get(v.channel_id)?.name ?? 'Unknown',
      avg_views: channelMap.get(v.channel_id)?.avg_views_per_video ?? v.views,
    }))
  }

  // Summary stats
  const totalVideos = Object.values(videoCounts).reduce((a, b) => a + b, 0)
  const avgGrowth = channelList.length > 0
    ? (channelList.reduce((s, c) => s + (c.growth_rate_30d ?? 0), 0) / channelList.length).toFixed(1)
    : '0'
  const platforms = [...new Set(channelList.map(c => c.platform))]

  if (channelList.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--accent-bright)" /> Channels
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            All YouTube and Twitch channels you&apos;re tracking
          </p>
        </div>
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 16
        }}>
          <Users size={32} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>No channels tracked yet</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Go to your subjects and add YouTube channels to start tracking their performance.
          </p>
          <Link href="/dashboard/subjects" className="btn-primary" style={{ fontSize: 14 }}>
            Go to Subjects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 32, flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--accent-bright)" /> Channels
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            All YouTube and Twitch channels you&apos;re tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="mono" style={{
            fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
            background: 'rgba(124,58,237,0.12)', color: 'var(--accent-bright)',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {channelList.length} total
          </span>
          <span className="mono" style={{
            fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
            background: 'rgba(255,68,68,0.1)', color: '#ff7c7c',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {platforms.length} platform{platforms.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="channels-stats-row" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28
      }}>
        {[
          { label: 'Total Channels', value: channelList.length, icon: <Users size={18} />, color: '#7c3aed' },
          { label: 'Videos Tracked', value: totalVideos, icon: <Play size={18} />, color: '#ff4444' },
          { label: 'Avg Growth Rate', value: `+${avgGrowth}%`, icon: <TrendingUp size={18} />, color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${stat.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Channels grid */}
      <div className="channels-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 40
      }}>
        {channelList.map(ch => {
          const color = platformColor[ch.platform] ?? '#7c3aed'
          const growth = ch.growth_rate_30d ?? 0
          const videoCount = videoCounts[ch.id] ?? 0
          const subjectName = (ch.subjects as any)?.name ?? ''

          return (
            <Link key={ch.id} href={`/dashboard/channels/${ch.id}`} style={{ textDecoration: 'none' }}>
              <div className="card channel-card" style={{ padding: '20px', height: '100%' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: ch.avatar_url ? `url(${ch.avatar_url}) center/cover` : `${color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color, fontSize: 18, fontWeight: 800,
                  }}>
                    {!ch.avatar_url && ch.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{ch.name}</span>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{platformLabel[ch.platform] ?? ch.platform}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatViews(ch.subscribers ?? 0)} subscribers
                    </div>
                  </div>
                </div>

                {subjectName && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                    From: <span style={{ color: 'var(--text-secondary)' }}>{subjectName}</span>
                  </div>
                )}

                {/* Mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formatViews(ch.avg_views_per_video ?? 0)}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>avg views</div>
                  </div>
                  <div style={{
                    padding: '8px 10px', borderRadius: 8, textAlign: 'center',
                    background: growth > 0 ? 'rgba(16,185,129,0.08)' : growth < 0 ? 'rgba(239,68,68,0.08)' : 'var(--bg-secondary)'
                  }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700,
                      color: growth > 0 ? '#10b981' : growth < 0 ? '#ef4444' : 'var(--text-primary)'
                    }}>
                      {growth > 0 ? '+' : ''}{growth}%
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>30d growth</div>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{videoCount}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>videos</div>
                  </div>
                </div>

                {ch.last_synced_at && (
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    synced {timeAgo(ch.last_synced_at)}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Top Videos */}
      {topVideos.length > 0 && (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
            🔥 Top Videos — Last 30 Days
          </h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {topVideos.map((video, i) => {
              const multiplier = video.avg_views > 0 ? video.views / video.avg_views : 1
              const isViral = multiplier >= 5
              const isHot   = multiplier >= 2
              const isWarm  = multiplier >= 1.5
              const perfColor = isViral ? '#ff7c7c' : isHot ? '#10b981' : '#f59e0b'
              const perfBg    = isViral ? 'rgba(255,92,92,0.12)' : isHot ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'

              return (
                <div key={video.id} className="hover-bg" style={{
                  padding: '12px 20px',
                  borderBottom: i < topVideos.length - 1 ? '1px solid var(--border)' : 'none',
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
                      {video.channel_name} · {timeAgo(video.published_at)}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatViews(video.views)}
                  </span>
                  {(isViral || isHot || isWarm) ? (
                    <span className="mono" style={{
                      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                      padding: '3px 8px', borderRadius: 100,
                      background: perfBg, color: perfColor,
                    }}>
                      {isViral ? '🔥 ' : '↑ '}{multiplier.toFixed(1)}x avg
                    </span>
                  ) : <span />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
