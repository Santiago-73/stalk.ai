import { createClient } from '@/lib/supabase/server'
import {
  Plus, TrendingUp, Zap, ArrowRight, Layers, Sparkles,
  BarChart3, Bell, BellRing, Eye, Flame, Image,
  Users, ExternalLink, ChevronRight, Radio, Target
} from 'lucide-react'
import Link from 'next/link'
import OnboardingModal from './OnboardingModal'
import SeedExample from './SeedExample'

/* ─── Color maps ──────────────────────────────────────────────────────────── */
const platformColor: Record<string, string> = {
  youtube: '#ff4444',
  reddit: '#ff6314',
  twitch: '#9146ff',
}

const platformLabel: Record<string, string> = {
  youtube: 'YouTube',
  reddit: 'Reddit',
  twitch: 'Twitch',
}

const statusColor: Record<string, { bg: string; text: string }> = {
  emerging: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  peak: { bg: 'rgba(255,92,92,0.12)', text: '#ff7c7c' },
  declining: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  dead: { bg: 'rgba(85,85,119,0.12)', text: '#555577' },
}

const alertTypeIcon: Record<string, string> = {
  viral_video: '🔥',
  emerging_trend: '📈',
  new_channel: '👤',
  competitor_change: '⚡',
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE — reads from real Supabase tables
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userId = user?.id ?? ''

  /* ── Parallel data fetch ────────────────────────────────────────────────── */
  const [
    { data: profile },
    { data: subjectsRaw, count: subjectsCount },
    { count: digestsThisWeek },
    { count: totalDigests },
    { data: trends },
    { data: channels, count: channelsCount },
    topVideosResult,
    { data: alerts },
    { data: emergingChannels },
  ] = await Promise.all([
    // Profile
    supabase.from('profiles').select('plan').eq('id', userId).single(),
    // Subjects
    supabase.from('subjects').select('id, name, description, created_at', { count: 'exact' })
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
    // Digests this week
    supabase.from('digests').select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    // Total digests
    supabase.from('digests').select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    // Trends (active, ordered by strength)
    supabase.from('trends').select('*')
      .eq('user_id', userId)
      .neq('status', 'dead')
      .order('strength_score', { ascending: false })
      .limit(6),
    // Channels count
    supabase.from('channels').select('id', { count: 'exact', head: false })
      .eq('user_id', userId),
    // Top videos this week — safe fetch without join
    supabase.from('videos').select('id, title, published_at, views, channel_id, thumbnail_url')
      .eq('user_id', userId)
      .gte('published_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('views', { ascending: false })
      .limit(5),
    // Alerts (newest first)
    supabase.from('alerts').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6),
    // Emerging channels (highest growth rate)
    supabase.from('channels').select('*')
      .eq('user_id', userId)
      .gt('growth_rate_30d', 10)
      .order('growth_rate_30d', { ascending: false })
      .limit(4),
  ])

  const plan = profile?.plan || 'free'
  const isPro = plan === 'pro' || plan === 'ultra'
  const username = user?.email?.split('@')[0] ?? ''
  const isNewUser = (subjectsCount ?? 0) === 0

  const trendsList = trends ?? []
  const videosList = topVideosResult?.data ?? []
  const alertsList = alerts ?? []
  const emergingList = emergingChannels ?? []
  const totalChannels = channelsCount ?? channels?.length ?? 0
  const unreadAlerts = alertsList.filter((a: any) => !a.read_at).length

  // Gradient colors for video thumbnails
  const thumbGradients = [
    'linear-gradient(135deg, #1a1a2e, #16213e)',
    'linear-gradient(135deg, #2d132c, #1a1a2e)',
    'linear-gradient(135deg, #1a2a1a, #0a1a0a)',
    'linear-gradient(135deg, #1a1a1a, #2a1a2a)',
    'linear-gradient(135deg, #0a1a2a, #1a0a2a)',
  ]

  return (
    <div>
      <OnboardingModal isNewUser={isNewUser} />
      <SeedExample shouldSeed={isNewUser} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 32, flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
            Hey, {username} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            {isNewUser
              ? "Let's get you set up — create your first subject below."
              : `Tracking ${subjectsCount} subject${(subjectsCount ?? 0) !== 1 ? 's' : ''} · ${totalChannels} channel${totalChannels !== 1 ? 's' : ''}${unreadAlerts > 0 ? ` · ${unreadAlerts} unread alert${unreadAlerts !== 1 ? 's' : ''}` : ''}`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isNewUser && (
            <span className="mono" style={{
              fontSize: 10, letterSpacing: '0.08em', fontWeight: 700,
              background: 'rgba(124,58,237,0.12)', color: 'var(--accent-bright)',
              padding: '5px 12px', borderRadius: 100,
              border: '1px solid rgba(124,58,237,0.2)',
              textTransform: 'uppercase'
            }}>
              {plan}
            </span>
          )}
          <Link href="/dashboard/subjects" className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>
            <Plus size={14} /> New subject
          </Link>
        </div>
      </div>

      {/* ── New user: empty state ───────────────────────────────────────── */}
      {isNewUser ? (
        <div style={{
          textAlign: 'center', padding: '64px 40px',
          background: 'var(--bg-card)', border: '1px dashed var(--border-bright)',
          borderRadius: 16
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(232,121,249,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={32} color="var(--accent-bright)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Create your first subject</h2>
          <p style={{
            color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 28px',
            lineHeight: 1.7, fontSize: 14
          }}>
            A subject is a niche you want to track — like &quot;Gaming&quot;, &quot;Fitness&quot; or &quot;AI Tools&quot;.
            Add YouTube channels, subreddits and Twitch streams as sources, and get AI-powered trend digests every day.
          </p>
          <Link href="/dashboard/subjects" className="btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
            <Plus size={16} /> Create subject
          </Link>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ───────────────────────────────────────────────── */}
          <div className="dash-kpi-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28
          }}>
            {[
              {
                label: 'Subjects', value: subjectsCount ?? 0,
                icon: <Layers size={18} />, color: '#7c3aed',
                sub: `${digestsThisWeek ?? 0} digests this week`,
                href: '/dashboard/subjects'
              },
              {
                label: 'Active Trends',
                value: trendsList.filter((t: any) => t.status !== 'declining').length,
                icon: <TrendingUp size={18} />, color: '#10b981',
                sub: trendsList.length > 0
                  ? `${trendsList.filter((t: any) => t.status === 'emerging').length} emerging`
                  : 'Add channels to detect',
                href: '#trends'
              },
              {
                label: 'Channels Tracked', value: totalChannels,
                icon: <Users size={18} />, color: '#f59e0b',
                sub: emergingList.length > 0
                  ? `${emergingList.length} growing fast`
                  : 'Sync a YouTube channel',
                href: '#channels'
              },
              {
                label: 'Alerts', value: unreadAlerts,
                icon: <BellRing size={18} />, color: '#ff5c5c',
                sub: `${alertsList.length} total`,
                href: '#alerts'
              },
            ].map((kpi, i) => (
              <a key={i} href={kpi.href} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  padding: '18px 20px', position: 'relative', overflow: 'hidden', height: '100%'
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${kpi.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: kpi.color
                    }}>
                      {kpi.icon}
                    </div>
                    <ArrowRight size={13} color="var(--text-muted)" />
                  </div>
                  <div className="dash-stat-value" style={{
                    fontSize: 28, fontWeight: 800, marginBottom: 2, letterSpacing: '-1px'
                  }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 11, color: kpi.color, fontWeight: 600 }}>{kpi.sub}</div>
                </div>
              </a>
            ))}
          </div>

          {/* ── Main grid: 2/3 content + 1/3 sidebar ────────────────────── */}
          <div className="dash-main-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start'
          }}>
            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Trending Topics ────────────────────────────────────────── */}
              <div id="trends" className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} color="var(--accent-bright)" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Active Trends</span>
                  </div>
                </div>
                {trendsList.length === 0 ? (
                  <div style={{
                    padding: '40px 20px', textAlign: 'center'
                  }}>
                    <TrendingUp size={28} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No trends detected yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
                      Add YouTube channels to your subjects and sync them — we&apos;ll start detecting trends automatically.
                    </div>
                  </div>
                ) : (
                  <div>
                    {trendsList.map((trend: any, i: number) => {
                      const sc = statusColor[trend.status] ?? statusColor.emerging
                      return (
                        <div key={trend.id} style={{
                          padding: '14px 20px',
                          borderBottom: i < trendsList.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.15s', cursor: 'pointer',
                        }}
                          onMouseEnter={(e: any) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                          onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{trend.topic}</span>
                              <div style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: platformColor[trend.source_platform] ?? '#7c3aed',
                              }}
                                title={platformLabel[trend.source_platform]}
                              />
                            </div>
                            <span className="mono" style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                              background: sc.bg, color: sc.text,
                              textTransform: 'uppercase', letterSpacing: '0.04em'
                            }}>
                              {trend.status}
                            </span>
                          </div>
                          {trend.detail && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {trend.detail}
                            </div>
                          )}
                          <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                            Detected {timeAgo(trend.first_detected_at)} · Strength {(trend.strength_score * 10).toFixed(1)}/10
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Top Videos ─────────────────────────────────────────────── */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flame size={16} color="#ff4444" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Top Videos This Week</span>
                  </div>
                </div>
                {videosList.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Flame size={28} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No videos synced yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
                      Sync a YouTube channel to see its top performing videos here.
                    </div>
                  </div>
                ) : (
                  <div>
                    {videosList.map((video: any, i: number) => {
                      const channelAvg = video.channels?.avg_views_per_video ?? 1
                      const multiplier = channelAvg > 0 ? video.views / channelAvg : 1
                      const isHot = multiplier >= 3
                      const perfColor = isHot ? '#ff7c7c' : multiplier >= 2 ? '#10b981' : '#f59e0b'
                      const perfBg = isHot
                        ? 'rgba(255,92,92,0.12)'
                        : multiplier >= 2 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'
                      return (
                        <div key={video.id} style={{
                          padding: '12px 20px',
                          borderBottom: i < videosList.length - 1 ? '1px solid var(--border)' : 'none',
                          display: 'grid', gridTemplateColumns: '80px 1fr auto auto',
                          gap: 14, alignItems: 'center',
                          transition: 'background 0.15s', cursor: 'pointer',
                        }}
                          onMouseEnter={(e: any) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                          onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            width: 80, height: 46, borderRadius: 8,
                            background: video.thumbnail_url
                              ? `url(${video.thumbnail_url}) center/cover`
                              : thumbGradients[i % thumbGradients.length],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, color: 'rgba(255,255,255,0.3)', flexShrink: 0
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
                              {video.channels?.name ?? 'Unknown'} · {timeAgo(video.published_at)}
                            </div>
                          </div>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {formatViews(video.views)}
                          </span>
                          <span className="mono" style={{
                            fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                            padding: '3px 8px', borderRadius: 100,
                            background: perfBg, color: perfColor
                          }}>
                            {isHot ? '🔥 ' : '↑ '}{multiplier.toFixed(1)}x avg
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Your Subjects ──────────────────────────────────────────── */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={16} color="var(--accent-bright)" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Your Subjects</span>
                  </div>
                  <Link href="/dashboard/subjects" className="mono" style={{
                    fontSize: 11, color: 'var(--accent-bright)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    Manage <ChevronRight size={12} />
                  </Link>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0
                }}>
                  {(subjectsRaw ?? []).slice(0, 6).map((subject: any) => (
                    <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`} style={{
                      textDecoration: 'none',
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <div style={{
                        padding: '16px 18px', transition: 'background 0.15s', cursor: 'pointer', height: '100%'
                      }}
                        onMouseEnter={(e: any) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {subject.name}
                        </div>
                        {subject.description && (
                          <div style={{
                            fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {subject.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Alerts Feed ────────────────────────────────────────────── */}
              <div id="alerts" className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 18px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={16} color="#ff5c5c" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Alerts</span>
                    {unreadAlerts > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: '#ff5c5c', color: 'white',
                        borderRadius: 100, padding: '1px 6px', minWidth: 18, textAlign: 'center'
                      }}>
                        {unreadAlerts}
                      </span>
                    )}
                  </div>
                </div>
                {alertsList.length === 0 ? (
                  <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                    <Bell size={24} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      No alerts yet. We&apos;ll notify you when something happens.
                    </div>
                  </div>
                ) : (
                  <div>
                    {alertsList.map((alert: any, i: number) => (
                      <div key={alert.id} style={{
                        padding: '12px 18px',
                        borderBottom: i < alertsList.length - 1 ? '1px solid var(--border)' : 'none',
                        opacity: alert.read_at ? 0.6 : 1,
                        transition: 'background 0.15s', cursor: 'pointer',
                      }}
                        onMouseEnter={(e: any) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                            {alertTypeIcon[alert.type] ?? '📋'}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                              marginBottom: 3, lineHeight: 1.3
                            }}>
                              {alert.title}
                            </div>
                            {alert.message && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {alert.message}
                              </div>
                            )}
                            <div className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                              {timeAgo(alert.created_at)}
                            </div>
                          </div>
                          {!alert.read_at && (
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: '#7c3aed', flexShrink: 0, marginTop: 5
                            }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Emerging Channels ──────────────────────────────────────── */}
              <div id="channels" className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 18px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Target size={16} color="#10b981" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Rising Channels</span>
                  </div>
                </div>
                {emergingList.length === 0 ? (
                  <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                    <Users size={24} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 240, margin: '0 auto' }}>
                      Sync channels to track growth. Fast growers will appear here.
                    </div>
                  </div>
                ) : (
                  <div>
                    {emergingList.map((channel: any, i: number) => (
                      <div key={channel.id} style={{
                        padding: '14px 18px',
                        borderBottom: i < emergingList.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'background 0.15s', cursor: 'pointer',
                      }}
                        onMouseEnter={(e: any) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: channel.avatar_url
                            ? `url(${channel.avatar_url}) center/cover`
                            : `${platformColor[channel.platform] ?? '#7c3aed'}22`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: platformColor[channel.platform] ?? '#7c3aed',
                          fontSize: 14, fontWeight: 800
                        }}>
                          {!channel.avatar_url && channel.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{channel.name}</span>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: platformColor[channel.platform] ?? '#7c3aed',
                            }} />
                          </div>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {formatViews(channel.subscribers)} subs · {formatViews(channel.avg_views_per_video)} avg
                          </div>
                        </div>
                        <span className="mono" style={{
                          fontSize: 11, fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap'
                        }}>
                          +{channel.growth_rate_30d}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Thumbnail Insights teaser ──────────────────────────────── */}
              <div className="card" style={{
                padding: 20, position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(232,121,249,0.04) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Image size={16} color="var(--accent-bright)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Thumbnail Insights</span>
                </div>
                <p style={{
                  fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14
                }}>
                  See which thumbnail styles drive the most clicks in your niche — colors, faces, text, composition.
                </p>
                <span className="mono" style={{
                  fontSize: 11, color: 'var(--accent-bright)',
                  display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
                }}>
                  Coming soon <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>

          {/* ── Upgrade CTA for free users ───────────────────────────────── */}
          {!isPro && (
            <div style={{
              marginTop: 28, borderRadius: 14, padding: '22px 24px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(232,121,249,0.06) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Zap size={16} color="#e879f9" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Unlock the full picture</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  Upgrade to Pro for Reddit + Twitch tracking, daily email digests, up to 50 subjects and unlimited generations.
                </p>
              </div>
              <Link href="/#pricing" style={{
                background: 'linear-gradient(135deg, #7c3aed, #e879f9)',
                color: 'white', borderRadius: 8, padding: '10px 20px',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                whiteSpace: 'nowrap', flexShrink: 0
              }}>
                See plans →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
