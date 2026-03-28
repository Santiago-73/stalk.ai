'use client'

import Link from 'next/link'
import {
  Eye, Zap, Bell, Youtube, MessageSquare, TrendingUp,
  Check, ArrowRight, Radio, Sparkles, Tv, Search,
  UserPlus, BarChart3, Image, Target, ChevronDown,
  LayoutDashboard, ImageIcon, BellRing, Settings
} from 'lucide-react'
import PricingLink from './_components/PricingLink'

export default function HomePage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <nav className="lp-nav-pill lp-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B61FF, #e879f9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Eye size={15} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Stalk<span style={{ color: '#9d79ff' }}>.ai</span>
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div className="lp-nav-links" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="#how-it-works" className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13, textDecoration: 'none' }}>How it works</a>
          <a href="#features" className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13, textDecoration: 'none' }}>Features</a>
          <PricingLink className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>Pricing</PricingLink>
          <a href="#faq" className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13, textDecoration: 'none' }}>FAQ</a>
          <Link href="/login" className="btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>
            Start free <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Nuevo headline orientado a valor + product preview mejorado
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="noise-bg" style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(123,97,255,0.14) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,121,249,0.07) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.3)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 40,
            fontSize: 12, color: '#a78bfa', fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            <Radio size={11} /> Tracking YouTube · Twitch · Reddit daily
          </div>

          {/* Headline — claro y orientado a valor */}
          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 800, lineHeight: 1.05,
            marginBottom: 8, letterSpacing: '-3px', color: 'var(--text-primary)'
          }}>
            Know what works in
          </h1>
          <h1 className="serif-italic gradient-text" style={{
            fontSize: 'clamp(42px, 7.5vw, 82px)', fontWeight: 400, lineHeight: 1.05,
            marginBottom: 32, letterSpacing: '-2px', display: 'block'
          }}>
            your niche — first.
          </h1>

          <p style={{
            fontSize: 19, color: 'var(--text-secondary)', maxWidth: 580,
            margin: '0 auto 52px', lineHeight: 1.75, fontWeight: 400
          }}>
            Stalk-AI cross-analyzes YouTube channels, Twitch streams and Reddit threads
            to surface trending topics, winning formats and growth opportunities.
            One actionable digest every morning.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-primary animate-pulse-glow" style={{ fontSize: 16, padding: '15px 32px' }}>
              Start free — no credit card <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{ fontSize: 16, padding: '15px 28px', textDecoration: 'none' }}>
              See how it works ↓
            </a>
          </div>

          <p className="mono" style={{ marginTop: 22, color: 'var(--text-muted)', fontSize: 12, letterSpacing: '0.04em' }}>
            free forever · pro from $9/mo
          </p>
        </div>

        {/* ── Platforms strip ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 32, marginTop: 48, flexWrap: 'wrap'
        }}>
          {[
            { icon: <Youtube size={18} />, name: 'YouTube', color: '#ff4444' },
            { icon: <Tv size={18} />, name: 'Twitch', color: '#9146ff' },
            { icon: <MessageSquare size={18} />, name: 'Reddit', color: '#ff6314' },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--text-muted)', fontSize: 14, fontWeight: 500
            }}>
              <span style={{ color: p.color }}>{p.icon}</span> {p.name}
            </div>
          ))}
        </div>

        {/* ── Product Preview — Dashboard real con KPIs + vídeos ── */}
        <div className="lp-mock-preview" style={{ maxWidth: 1060, margin: '72px auto 0', position: 'relative', width: '100%' }}>
          <div style={{
            padding: 2, borderRadius: '2rem', overflow: 'hidden',
            border: '1px solid rgba(123,97,255,0.3)',
            boxShadow: '0 0 60px rgba(123,97,255,0.12), 0 40px 80px rgba(0,0,0,0.5)'
          }}>
            {/* Browser chrome */}
            <div style={{
              background: 'var(--bg-card)', borderTopLeftRadius: 'calc(2rem - 2px)',
              borderTopRightRadius: 'calc(2rem - 2px)',
              padding: '12px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <span className="mono" style={{
                flex: 1, textAlign: 'center', fontSize: 11,
                color: 'var(--text-muted)', letterSpacing: '0.03em'
              }}>
                stalk-ai.com/dashboard
              </span>
              <div style={{ width: 30 }} />
            </div>

            <div style={{
              background: 'var(--bg-card)',
              borderBottomLeftRadius: 'calc(2rem - 2px)',
              borderBottomRightRadius: 'calc(2rem - 2px)',
              display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 460
            }}>
              {/* ── Sidebar ── */}
              <div className="lp-mock-sidebar" style={{
                borderRight: '1px solid var(--border)', padding: '20px 12px',
                display: 'flex', flexDirection: 'column', gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 20 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7B61FF, #e879f9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Eye size={12} color="white" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                    Stalk<span style={{ color: '#9d79ff' }}>.ai</span>
                  </span>
                </div>
                {[
                  { label: 'Dashboard', icon: <LayoutDashboard size={14} />, active: true },
                  { label: 'Trends', icon: <TrendingUp size={14} />, active: false },
                  { label: 'Channels', icon: <UserPlus size={14} />, active: false },
                  { label: 'Thumbnails', icon: <ImageIcon size={14} />, active: false },
                  { label: 'Alerts', icon: <BellRing size={14} />, active: false },
                  { label: 'Settings', icon: <Settings size={14} />, active: false },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: item.active ? 'rgba(123,97,255,0.15)' : 'transparent',
                    color: item.active ? '#a78bfa' : 'var(--text-muted)',
                    border: item.active ? '1px solid rgba(123,97,255,0.2)' : '1px solid transparent',
                  }}>
                    {item.icon} {item.label}
                  </div>
                ))}
              </div>

              {/* ── Main content — dashboard con KPIs + vídeos ── */}
              <div style={{ padding: '20px 24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    📊 Your Niche Overview
                  </span>
                  <span className="mono" style={{
                    fontSize: 10, letterSpacing: '0.08em', fontWeight: 700,
                    background: 'rgba(123,97,255,0.12)', color: '#a78bfa',
                    padding: '3px 10px', borderRadius: 100,
                    border: '1px solid rgba(123,97,255,0.2)'
                  }}>
                    GAMING
                  </span>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'CHANNELS', value: '24', change: '+3 this week', up: true },
                    { label: 'ACTIVE TRENDS', value: '7', change: '2 emerging', up: true },
                    { label: 'AVG VIEWS', value: '45K', change: '↑ 12%', up: true },
                    { label: 'ALERTS', value: '3', change: '1 viral', up: null },
                  ].map((kpi, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 14, padding: '12px 14px'
                    }}>
                      <div className="mono" style={{
                        fontSize: 9, color: 'var(--text-muted)',
                        letterSpacing: '0.08em', marginBottom: 4
                      }}>
                        {kpi.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-1px' }}>
                        {kpi.value}
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 600, marginTop: 2,
                        color: kpi.up === true ? 'var(--success, #10b981)'
                          : kpi.up === false ? '#ff5c5c'
                          : '#f59e0b'
                      }}>
                        {kpi.change}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top videos */}
                <div style={{ marginBottom: 4 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10
                  }}>
                    🔥 Top performing videos this week
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      {
                        title: 'I Played The New Update for 100 Hours...',
                        channel: 'GamerzPro · 2d ago',
                        views: '312K',
                        perf: '🔥 6.8x avg',
                        perfColor: '#ff7c7c',
                        perfBg: 'rgba(255,92,92,0.12)',
                        gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)'
                      },
                      {
                        title: 'Why Everyone Is Wrong About This Meta',
                        channel: 'StrategyKing · 3d ago',
                        views: '189K',
                        perf: '↑ 3.2x avg',
                        perfColor: '#10b981',
                        perfBg: 'rgba(16,185,129,0.12)',
                        gradient: 'linear-gradient(135deg, #2d132c, #1a1a2e)'
                      },
                      {
                        title: 'Beginner to Pro in 30 Days Challenge',
                        channel: 'NoobishPlays · 1d ago',
                        views: '97K',
                        perf: '↑ 1.8x avg',
                        perfColor: '#f59e0b',
                        perfBg: 'rgba(245,158,11,0.12)',
                        gradient: 'linear-gradient(135deg, #1a2a1a, #0a1a0a)'
                      },
                    ].map((v, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '100px 1fr auto auto',
                        gap: 14, alignItems: 'center', padding: '8px 12px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        borderRadius: 12
                      }}>
                        <div style={{
                          width: 100, height: 56, borderRadius: 8,
                          background: v.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, color: 'rgba(255,255,255,0.4)'
                        }}>
                          ▶
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {v.title}
                          </div>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            {v.channel}
                          </div>
                        </div>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {v.views}
                        </span>
                        <span className="mono" style={{
                          fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                          padding: '3px 8px', borderRadius: 100,
                          background: v.perfBg, color: v.perfColor
                        }}>
                          {v.perf}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS — 3 pasos con ejemplos concretos
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="lp-section" style={{
        padding: '120px 40px', borderTop: '1px solid var(--border)', scrollMarginTop: 80
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p className="mono" style={{
              color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', marginBottom: 16
            }}>
              How it works
            </p>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800,
              marginBottom: 16, letterSpacing: '-1.5px'
            }}>
              From zero to insights{' '}
              <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>in 2 minutes</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 520, margin: '0 auto' }}>
              No complex setup. No API keys. Just pick your niche and let Stalk-AI do the research.
            </p>
          </div>

          <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                icon: <Search size={24} />,
                title: 'Choose your niche',
                desc: 'Tell us what you create content about. We\'ll suggest relevant channels, subreddits and streams to track.',
                color: '#f59e0b',
                mono: '01 / PICK YOUR NICHE',
                example: { text: 'e.g.', items: ['"Gaming"', '"Fitness"', '"AI Tools"', '"Cooking"'] }
              },
              {
                icon: <UserPlus size={24} />,
                title: 'Add your sources',
                desc: 'Add YouTube channels, Twitch streamers and subreddits you want to monitor. Paste a URL or search by name.',
                color: '#7B61FF',
                mono: '02 / ADD SOURCES',
                example: { text: '', items: ['youtube.com/c/MKBHD → added ✓'] }
              },
              {
                icon: <Sparkles size={24} />,
                title: 'Get daily insights',
                desc: 'Every morning, receive a digest with trending topics, top-performing videos and actionable opportunities.',
                color: '#10b981',
                mono: '03 / GET INSIGHTS',
                example: { text: '🔥', items: ['"Retro gaming" trending on Reddit → 0 YT videos yet'] }
              },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: 36, position: 'relative', overflow: 'hidden' }}>
                <p className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 24 }}>
                  {f.mono}
                </p>
                <div style={{
                  width: 52, height: 52, borderRadius: '1.25rem', marginBottom: 24,
                  background: `${f.color}1a`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: f.color,
                  border: `1px solid ${f.color}30`
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.5px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 15, marginBottom: 18 }}>{f.desc}</p>

                {/* Ejemplo concreto */}
                <div className="mono" style={{
                  fontSize: 11, color: 'var(--text-muted)', padding: '10px 14px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 10, lineHeight: 1.5
                }}>
                  {f.example.text}{' '}
                  <span style={{ color: '#a78bfa' }}>{f.example.items.join(' ')}</span>
                </div>

                <div style={{
                  position: 'absolute', bottom: -40, right: -40,
                  width: 120, height: 120, borderRadius: '50%',
                  background: `radial-gradient(circle, ${f.color}12 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DIGEST DEMO — Muestra un digest real con datos accionables
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '120px 40px', borderTop: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="lp-digest-layout" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center'
          }}>
            {/* Left — copy */}
            <div>
              <p className="mono" style={{
                color: '#a78bfa', fontSize: 11, letterSpacing: '0.12em',
                textTransform: 'uppercase', marginBottom: 16
              }}>
                📬 AI Digests
              </p>
              <h2 style={{
                fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800,
                marginBottom: 16, letterSpacing: '-1.5px', lineHeight: 1.15
              }}>
                Your morning briefing,{' '}
                <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>powered by AI</span>
              </h2>
              <p style={{
                color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.75,
                marginBottom: 36, maxWidth: 460
              }}>
                Every day, Stalk-AI cross-analyzes all your sources and surfaces what matters.
                Not just news — actionable intelligence for creators.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {[
                  {
                    emoji: '🎯',
                    title: 'Topics with no competition yet',
                    desc: 'Detects themes trending on Reddit that have zero YouTube coverage. Be first.',
                    color: 'rgba(123,97,255,0.12)'
                  },
                  {
                    emoji: '📈',
                    title: 'Outlier videos in your niche',
                    desc: 'Spots videos performing 3x+ above their channel average. Learn what worked.',
                    color: 'rgba(255,68,68,0.1)'
                  },
                  {
                    emoji: '⚡',
                    title: 'Format and angle suggestions',
                    desc: 'AI analyzes which titles, thumbnails and formats are winning this week.',
                    color: 'rgba(245,158,11,0.1)'
                  },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: f.color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16
                    }}>
                      {f.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — digest mockup */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✨ AI Digest — Gaming
                </span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Today, 8:00 AM</span>
              </div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    topic: '🔥 "Retro speedruns" resurgence',
                    badge: 'EMERGING', badgeColor: '#10b981', badgeBg: 'rgba(16,185,129,0.12)',
                    desc: '12 Reddit posts in r/speedrun this week (3x normal). Only 2 YouTube videos on the topic. Low competition window.',
                    sources: [
                      { label: 'Reddit 12 posts', color: '#ff6314', bg: 'rgba(255,99,20,0.1)' },
                      { label: 'YouTube 2 videos', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' }
                    ]
                  },
                  {
                    topic: '📈 Outlier: GamerzPro broke out',
                    badge: '6.8x AVG', badgeColor: '#ff7c7c', badgeBg: 'rgba(255,92,92,0.12)',
                    desc: 'His "100 Hours" video hit 312K views vs his 46K average. Hook: first-person challenge with time constraint.',
                    sources: [
                      { label: 'YouTube outlier', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' }
                    ]
                  },
                  {
                    topic: '⚡ Twitch → YouTube pipeline',
                    badge: 'RISING', badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)',
                    desc: '3 gaming streamers posted "best of" compilations this week — all above 2x channel average.',
                    sources: [
                      { label: 'Twitch 3 clips', color: '#9146ff', bg: 'rgba(145,70,255,0.1)' },
                      { label: 'YouTube 3 videos', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' }
                    ]
                  },
                ].map((t, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: 14
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{t.topic}</span>
                      <span className="mono" style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        background: t.badgeBg, color: t.badgeColor, letterSpacing: '0.04em'
                      }}>
                        {t.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                      {t.desc}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {t.sources.map((s, j) => (
                        <span key={j} className="mono" style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                          background: s.bg, color: s.color
                        }}>
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES — 4 features con beneficios concretos
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" style={{
        padding: '120px 40px', borderTop: '1px solid var(--border)', scrollMarginTop: 80
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p className="mono" style={{
              color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', marginBottom: 16
            }}>
              Features
            </p>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800,
              marginBottom: 16, letterSpacing: '-1.5px'
            }}>
              Everything to{' '}
              <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>dominate your niche</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 500, margin: '0 auto' }}>
              Not just data. Intelligence you can act on today.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="lp-features-2col">
            {[
              {
                tag: 'TREND DETECTION',
                icon: <TrendingUp size={20} />,
                title: 'Spot trends before they peak',
                desc: 'Cross-platform analysis detects emerging topics on Reddit before they hit YouTube. You get a head start of days — sometimes weeks.',
                stat: { val: '3 platforms', rest: 'analyzed simultaneously' },
                color: '#ff4444'
              },
              {
                tag: 'CHANNEL INTELLIGENCE',
                icon: <BarChart3 size={20} />,
                title: 'Track any channel\'s strategy',
                desc: 'Monitor competitors\' upload frequency, view patterns, growth spikes and topic shifts. Know when they change strategy — instantly.',
                stat: { val: '24/7', rest: 'automated monitoring' },
                color: '#10b981'
              },
              {
                tag: 'THUMBNAIL ANALYSIS',
                icon: <Image size={20} />,
                title: 'See which thumbnails win clicks',
                desc: 'AI analyzes the visual patterns behind top-performing thumbnails: colors, faces, text placement, composition. Learn what drives CTR.',
                stat: { val: 'Patterns', rest: 'across your entire niche' },
                color: '#9146ff'
              },
              {
                tag: 'AI INSIGHTS',
                icon: <Target size={20} />,
                title: 'Actionable, not just informational',
                desc: 'Every insight comes with context: why it matters, what you can do about it, and how much opportunity exists. No vanity metrics.',
                stat: { val: 'Daily', rest: 'personalized digests' },
                color: '#7B61FF'
              },
            ].map((f, i) => (
              <div key={i} className="card" style={{
                padding: 36, position: 'relative', overflow: 'hidden',
                borderTop: `2px solid transparent`,
                transition: 'border-color 0.3s ease'
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderTopColor = f.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderTopColor = 'transparent')}
              >
                <p className="mono" style={{
                  fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16
                }}>
                  {f.tag}
                </p>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.5px' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 15, marginBottom: 20 }}>
                  {f.desc}
                </p>
                <div className="mono" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, color: 'var(--text-muted)', padding: '6px 12px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 8
                }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>{f.stat.val}</span> {f.stat.rest}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          BEFORE / AFTER — Contraste visual del problema vs solución
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p className="mono" style={{
            color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 16
          }}>
            The difference
          </p>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800,
            marginBottom: 16, letterSpacing: '-1.5px'
          }}>
            Stop guessing.{' '}
            <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>Start knowing.</span>
          </h2>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24,
            marginTop: 48, textAlign: 'left'
          }} className="lp-comparison-grid">
            {/* Before */}
            <div className="card" style={{ padding: 32 }}>
              <h3 style={{
                fontSize: 16, fontWeight: 700, marginBottom: 24,
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                😩 Without Stalk-AI
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  '2+ hours scrolling YouTube, Reddit, Twitch daily',
                  'Guessing which topics will work',
                  'Missing trends until competitors already covered them',
                  'No idea which thumbnails actually drive clicks',
                  'Flying blind on what your niche audience wants',
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5
                  }}>
                    <span style={{ color: '#ff5c5c', flexShrink: 0, marginTop: 1 }}>✗</span> {item}
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div style={{
              padding: 32, borderRadius: '1.5rem',
              background: 'linear-gradient(135deg, rgba(123,97,255,0.08), rgba(123,97,255,0.02))',
              border: '1px solid rgba(123,97,255,0.25)'
            }}>
              <h3 style={{
                fontSize: 16, fontWeight: 700, marginBottom: 24,
                color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 8
              }}>
                🚀 With Stalk-AI
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'One 5-minute digest covers everything',
                  'Data-backed topics with proof they\'re rising',
                  'Spot trends days before they peak',
                  'Know exactly what thumbnail styles win',
                  'Daily insights on what your audience craves',
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5
                  }}>
                    <span style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }}>✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="lp-section" style={{
        padding: '120px 40px', borderTop: '1px solid var(--border)', scrollMarginTop: '90px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p className="mono" style={{
              color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', marginBottom: 16
            }}>
              Pricing
            </p>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800,
              marginBottom: 16, letterSpacing: '-1.5px'
            }}>
              Simple pricing.{' '}
              <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>No surprises.</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>
              Start free. Upgrade when the insights pay for themselves.
            </p>
          </div>

          <div className="lp-pricing-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'start'
          }}>
            {[
              {
                name: 'Free',
                price: '0',
                desc: 'Perfect to explore what Stalk-AI can do.',
                features: [
                  'Up to 3 subjects',
                  '3 sources per subject',
                  'YouTube only',
                  '1 manual digest per day',
                ],
                cta: 'Start free',
                href: '/login',
                highlight: false
              },
              {
                name: 'Pro',
                price: '9',
                desc: 'For creators who need an unfair advantage.',
                features: [
                  'Up to 50 subjects',
                  '15 sources per subject',
                  'YouTube + Reddit + Twitch',
                  'Daily digest by email every morning',
                  'Unlimited generations',
                ],
                cta: 'Get Pro',
                href: '/api/stripe/checkout?plan=pro',
                highlight: true
              },
              {
                name: 'Ultra',
                price: '19',
                desc: 'For serious creators who want the deepest insights.',
                features: [
                  'Unlimited subjects & sources',
                  'Everything in Pro',
                  'Deep Video Analysis — Gemini 2.5 analyzes hook, structure & what you can replicate',
                  'Priority support',
                ],
                cta: 'Get Ultra',
                href: '/api/stripe/checkout?plan=ultra',
                highlight: false
              }
            ].map((plan, i) => (
              <div key={i} style={{
                padding: 36, borderRadius: '2rem',
                border: plan.highlight ? '1px solid rgba(123,97,255,0.5)' : '1px solid var(--border)',
                background: plan.highlight
                  ? 'linear-gradient(160deg, rgba(123,97,255,0.15), rgba(232,121,249,0.05))'
                  : 'var(--bg-card)',
                position: 'relative',
                boxShadow: plan.highlight ? '0 0 50px rgba(123,97,255,0.12)' : 'none',
                transition: 'transform 0.25s ease',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7B61FF, #e879f9)',
                    color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px',
                    borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.04em'
                  }}>
                    Most Popular
                  </div>
                )}
                <div style={{ marginBottom: 28 }}>
                  <p className="mono" style={{
                    fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em',
                    textTransform: 'uppercase', marginBottom: 12
                  }}>
                    {plan.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-3px' }}>
                      ${plan.price}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>/month</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{plan.desc}</p>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 36 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6
                    }}>
                      <Check size={14} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={plan.highlight ? 'btn-primary' : 'btn-secondary'} style={{
                  width: '100%', justifyContent: 'center', display: 'flex'
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{
        padding: '120px 40px', borderTop: '1px solid var(--border)', scrollMarginTop: 80
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p className="mono" style={{
            color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 16
          }}>
            FAQ
          </p>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800,
            marginBottom: 48, letterSpacing: '-1.5px'
          }}>
            Common{' '}
            <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>questions</span>
          </h2>

          <div style={{ textAlign: 'left' }}>
            {[
              {
                q: 'What exactly does Stalk-AI do?',
                a: 'Stalk-AI monitors YouTube channels, Twitch streams and Reddit subreddits in your niche. Our AI cross-analyzes all the content to detect trending topics, winning formats and growth opportunities — and delivers it as a simple daily digest you can act on.'
              },
              {
                q: 'How is this different from VidIQ or TubeBuddy?',
                a: 'VidIQ and TubeBuddy focus on optimizing YOUR channel — SEO, tags, thumbnails. Stalk-AI focuses on understanding your NICHE — what topics are trending, what competitors are doing, and where the opportunities are. They optimize execution; we inform strategy. They\'re complementary tools.'
              },
              {
                q: 'Do I need to be a big creator to benefit?',
                a: 'Not at all. Stalk-AI is most valuable for creators who are growing — knowing which topics and formats are working in your niche helps you make every video count, regardless of your current audience size.'
              },
              {
                q: 'How often are the digests updated?',
                a: 'Free users get 1 manual digest per day. Pro and Ultra users receive an automated digest every morning via email, plus unlimited on-demand generations from the dashboard.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. No contracts, no hidden fees. Cancel from your settings page and keep access until the end of your billing period.'
              },
              {
                q: 'What\'s "Deep Video Analysis" in the Ultra plan?',
                a: 'Powered by Gemini 2.5, it watches the full YouTube video and analyzes the hook, structure, pacing and why it performed well — giving you a breakdown of what you can replicate in your own content.'
              },
            ].map((faq, i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <summary style={{
                  padding: '20px 0', fontSize: 16, fontWeight: 500,
                  cursor: 'pointer', listStyle: 'none', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  color: 'var(--text-primary)',
                }}>
                  {faq.q}
                  <ChevronDown size={18} color="var(--text-muted)" style={{ flexShrink: 0, transition: 'transform 0.2s' }} />
                </summary>
                <p style={{
                  paddingBottom: 20, fontSize: 15, color: 'var(--text-secondary)',
                  lineHeight: 1.7
                }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '120px 40px', borderTop: '1px solid var(--border)',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', bottom: -200, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(123,97,255,0.1) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />

        <h2 style={{
          fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800,
          marginBottom: 16, letterSpacing: '-1.5px', position: 'relative',
          maxWidth: 600, margin: '0 auto 16px'
        }}>
          Stop scrolling for ideas.{' '}
          <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>Start knowing.</span>
        </h2>
        <p style={{
          color: 'var(--text-secondary)', fontSize: 18, maxWidth: 500,
          margin: '0 auto 40px', lineHeight: 1.7
        }}>
          Join creators who wake up every morning knowing exactly what to create. Free forever — no credit card needed.
        </p>
        <Link href="/login" className="btn-primary animate-pulse-glow" style={{
          fontSize: 16, padding: '15px 36px', position: 'relative'
        }}>
          Start free — takes 2 minutes <ArrowRight size={16} />
        </Link>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="lp-footer" style={{
        background: '#060610',
        borderTop: '1px solid var(--border)',
        borderRadius: '2.5rem 2.5rem 0 0',
        marginTop: 2,
        padding: '48px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: 'var(--text-muted)', fontSize: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Eye size={16} color="#7B61FF" />
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Stalk.ai</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot" />
          <span className="mono" style={{ fontSize: 11, color: '#10b981', letterSpacing: '0.06em' }}>System Active</span>
        </div>

        <span>© 2026 Stalk.ai. All rights reserved.</span>

        <div className="lp-footer-links" style={{ display: 'flex', gap: 24 }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
