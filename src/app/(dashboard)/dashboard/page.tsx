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

/* ─── Mock data (will be replaced with Supabase queries) ──────────────── */
const MOCK_TRENDS = [
  {
    id: '1', topic: 'Retro speedruns', source_platform: 'reddit',
    strength_score: 0.87, status: 'emerging',
    first_detected_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    detail: '12 posts in r/speedrun this week (3x normal). Only 2 YouTube videos.',
  },
  {
    id: '2', topic: 'AI voice cloning tools', source_platform: 'youtube',
    strength_score: 0.92, status: 'peak',
    first_detected_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    detail: '8 channels covered this topic. Average 2.4x their normal views.',
  },
  {
    id: '3', topic: 'Cozy game aesthetics', source_platform: 'twitch',
    strength_score: 0.65, status: 'emerging',
    first_detected_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    detail: '3 streamers gained 40%+ followers this week with cozy content.',
  },
  {
    id: '4', topic: 'Thumbnail face reactions', source_platform: 'youtube',
    strength_score: 0.45, status: 'declining',
    first_detected_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    detail: 'Engagement dropping. Oversaturated — consider alternative styles.',
  },
]

const MOCK_TOP_VIDEOS = [
  {
    id: '1', title: 'I Played The New Update for 100 Hours...',
    channel_name: 'GamerzPro', published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    views: 312000, avg_channel_views: 46000,
    gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  },
  {
    id: '2', title: 'Why Everyone Is Wrong About This Meta',
    channel_name: 'StrategyKing', published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    views: 189000, avg_channel_views: 59000,
    gradient: 'linear-gradient(135deg, #2d132c, #1a1a2e)',
  },
  {
    id: '3', title: 'Beginner to Pro in 30 Days Challenge',
    channel_name: 'NoobishPlays', published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    views: 97000, avg_channel_views: 54000,
    gradient: 'linear-gradient(135deg, #1a2a1a, #0a1a0a)',
  },
  {
    id: '4', title: 'This Hidden Setting Changes Everything',
    channel_name: 'TechTips', published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    views: 245000, avg_channel_views: 120000,
    gradient: 'linear-gradient(135deg, #1a1a1a, #2a1a2a)',
  },
]

const MOCK_EMERGING_CHANNELS = [
  {
    id: '1', name: 'NoobishPlays', platform: 'youtube',
    subscribers: 34200, growth_rate_30d: 42,
    avg_views: 54000, avatar_color: '#7c3aed',
  },
  {
    id: '2', name: 'CozyGamerGirl', platform: 'twitch',
    subscribers: 12800, growth_rate_30d: 67,
    avg_views: 890, avatar_color: '#9146ff',
  },
  {
    id: '3', name: 'RetroRunsDaily', platform: 'youtube',
    subscribers: 8400, growth_rate_30d: 128,
    avg_views: 23000, avatar_color: '#f59e0b',
  },
]

const MOCK_ALERTS = [
  {
    id: '1', type: 'viral_video', title: 'GamerzPro video hit 6.8x average',
    message: '"I Played The New Update for 100 Hours" — 312K views vs 46K avg',
    created_at: new Date(Date.now() - 3600000).toISOString(), read_at: null,
  },
  {
    id: '2', type: 'emerging_trend', title: '"Retro speedruns" detected on Reddit',
    message: '3x normal activity in r/speedrun. Low YouTube competition.',
    created_at: new Date(Date.now() - 7200000).toISOString(), read_at: null,
  },
  {
    id: '3', type: 'new_channel', title: 'RetroRunsDaily growing +128% in 30d',
    message: 'New channel in your niche with anomalous growth pattern.',
    created_at: new Date(Date.now() - 14400000).toISOString(), read_at: new Date().toISOString(),
  },
  {
    id: '4', type: 'competitor_change', title: 'StrategyKing changed upload frequency',
    message: 'Went from 1/week to 3/week. Views per video holding steady.',
    created_at: new Date(Date.now() - 28800000).toISOString(), read_at: new Date().toISOString(),
  },
]

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: subjectsRaw, count: subjectsCount },
    { count: digestsThisWeek },
    { count: totalDigests },
  ] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user?.id ?? '').single(),
    supabase.from('subjects').select('id, name, description, created_at', { count: 'exact' })
      .eq('user_id', user?.id ?? '').order('created_at', { ascending: false }).limit(6),
    supabase.from('digests').select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id ?? '')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('digests').select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id ?? ''),
  ])

  const plan = profile?.plan || 'free'
  const isPro = plan === 'pro' || plan === 'ultra'
  const username = user?.email?.split('@')[0] ?? ''
  const isNewUser = (subjectsCount ?? 0) === 0

  // TODO: Replace mock data with real Supabase queries when tables exist
  const trends = MOCK_TRENDS
  const topVideos = MOCK_TOP_VIDEOS
  const emergingChannels = MOCK_EMERGING_CHANNELS
  const alerts = MOCK_ALERTS

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
              : `Tracking ${subjectsCount} subject${(subjectsCount ?? 0) !== 1 ? 's' : ''}. ${alerts.filter(a => !a.read_at).length} unread alerts.`
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
                sub: `${digestsThisWeek ?? 0} digests this week`, href: '/dashboard/subjects'
              },
              {
                label: 'Active Trends', value: trends.filter(t => t.status !== 'declining').length,
                icon: <TrendingUp size={18} />, color: '#10b981',
                sub: `${trends.filter(t => t.status === 'emerging').length} emerging`, href: '/dashboard/trends'
              },
              {
                label: 'Channels Tracked', value: 24,
                icon: <Users size={18} />, color: '#f59e0b',
                sub: `${emergingChannels.length} growing fast`, href: '/dashboard/channels'
              },
              {
                label: 'Alerts', value: alerts.filter(a => !a.read_at).length,
                icon: <BellRing size={18} />, color: '#ff5c5c',
                sub: `${alerts.length} total`, href: '/dashboard/alerts'
              },
            ].map((kpi, i) => (
              <Link key={i} href={kpi.href ?? '#'} style={{ textDecoration: 'none' }}>
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
              </Link>
            ))}
          </div>

          {/* ── Main grid: 2/3 content + 1/3 sidebar ────────────────────── */}
          <div className="dash-main-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start'
          }}>
            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Trending Topics ────────────────────────────────────────── */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} color="var(--accent-bright)" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Active Trends</span>
                  </div>
                  <Link href="/dashboard/trends" className="mono" style={{
                    fontSize: 11, color: 'var(--accent-bright)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    View all <ChevronRight size={12} />
                  </Link>
                </div>
                <div>
                  {trends.map((trend, i) => {
                    const sc = statusColor[trend.status] ?? statusColor.emerging
                    const perfMultiplier = (trend.strength_score * 10).toFixed(1)
                    return (
                      <div key={trend.id} className="hover-bg" style={{
                        padding: '14px 20px',
                        borderBottom: i < trends.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginBottom: 6
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{trend.topic}</span>
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: platformColor[trend.source_platform] ?? '#7c3aed',
                              flexShrink: 0
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
                        <div style={{
                          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5
                        }}>
                          {trend.detail}
                        </div>
                        <div className="mono" style={{
                          fontSize: 10, color: 'var(--text-muted)', marginTop: 6
                        }}>
                          Detected {timeAgo(trend.first_detected_at)} · Strength {perfMultiplier}/10
                        </div>
                      </div>
                    )
                  })}
                </div>
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
                  <Link href="/dashboard/channels" className="mono" style={{
                    fontSize: 11, color: 'var(--accent-bright)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    All channels <ChevronRight size={12} />
                  </Link>
                </div>
                <div>
                  {topVideos.map((video, i) => {
                    const multiplier = video.views / video.avg_channel_views
                    const isHot = multiplier >= 3
                    const perfColor = isHot ? '#ff7c7c' : multiplier >= 2 ? '#10b981' : '#f59e0b'
                    const perfBg = isHot
                      ? 'rgba(255,92,92,0.12)'
                      : multiplier >= 2 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'
                    return (
                      <div key={video.id} className="hover-bg" style={{
                        padding: '12px 20px',
                        borderBottom: i < topVideos.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'grid', gridTemplateColumns: '80px 1fr auto auto',
                        gap: 14, alignItems: 'center',
                        transition: 'background 0.15s', cursor: 'pointer',
                      }}>
                        {/* Thumbnail placeholder */}
                        <div style={{
                          width: 80, height: 46, borderRadius: 8,
                          background: video.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, color: 'rgba(255,255,255,0.3)', flexShrink: 0
                        }}>
                          ▶
                        </div>
                        {/* Info */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {video.title}
                          </div>
                          <div className="mono" style={{
                            fontSize: 10, color: 'var(--text-muted)', marginTop: 2
                          }}>
                            {video.channel_name} · {timeAgo(video.published_at)}
                          </div>
                        </div>
                        {/* Views */}
                        <span className="mono" style={{
                          fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap'
                        }}>
                          {formatViews(video.views)}
                        </span>
                        {/* Performance badge */}
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
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 0
                }}>
                  {(subjectsRaw ?? []).slice(0, 6).map((subject, i) => (
                    <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`} style={{
                      textDecoration: 'none',
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <div className="hover-bg" style={{
                        padding: '16px 18px', transition: 'background 0.15s', cursor: 'pointer',
                        height: '100%'
                      }}>
                        <div style={{
                          fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
                          marginBottom: 4
                        }}>
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
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 18px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={16} color="#ff5c5c" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Alerts</span>
                    {alerts.filter(a => !a.read_at).length > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: '#ff5c5c', color: 'white',
                        borderRadius: 100, padding: '1px 6px', minWidth: 18, textAlign: 'center'
                      }}>
                        {alerts.filter(a => !a.read_at).length}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {alerts.map((alert, i) => (
                    <div key={alert.id} className="hover-bg" style={{
                      padding: '12px 18px',
                      borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: alert.read_at ? 0.6 : 1,
                      transition: 'background 0.15s', cursor: 'pointer',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10
                      }}>
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
                          <div style={{
                            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4
                          }}>
                            {alert.message}
                          </div>
                          <div className="mono" style={{
                            fontSize: 9, color: 'var(--text-muted)', marginTop: 4
                          }}>
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
              </div>

              {/* ── Emerging Channels ──────────────────────────────────────── */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 18px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Target size={16} color="#10b981" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Rising Channels</span>
                  </div>
                  <Link href="/dashboard/channels" className="mono" style={{
                    fontSize: 11, color: 'var(--accent-bright)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    All <ChevronRight size={12} />
                  </Link>
                </div>
                <div>
                  {emergingChannels.map((channel, i) => (
                    <div key={channel.id} className="hover-bg" style={{
                      padding: '14px 18px',
                      borderBottom: i < emergingChannels.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'background 0.15s', cursor: 'pointer',
                    }}>
                      {/* Avatar placeholder */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `${channel.avatar_color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: channel.avatar_color, fontSize: 14, fontWeight: 800
                      }}>
                        {channel.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{channel.name}</span>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: platformColor[channel.platform] ?? '#7c3aed',
                            flexShrink: 0
                          }} />
                        </div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {formatViews(channel.subscribers)} subs · {formatViews(channel.avg_views)} avg
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
                <Link href="/dashboard/thumbnails" className="mono" style={{
                  fontSize: 11, color: 'var(--accent-bright)', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
                }}>
                  Explore thumbnails <ArrowRight size={12} />
                </Link>
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
