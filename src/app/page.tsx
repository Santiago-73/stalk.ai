import Link from 'next/link'
import {
  Eye, Zap, Bell, TrendingUp, Youtube, MessageSquare, Rss,
  Check, ArrowRight, Radio, BookOpen, Sparkles, Tv, Lightbulb
} from 'lucide-react'
import PricingLink from './_components/PricingLink'

export default function HomePage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* ── Navbar — pill centrado fijo ───────────────────────────────────── */}
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
          <PricingLink className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>Pricing</PricingLink>
          <Link href="/login" className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>Log in</Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>
            Start free <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero — 100dvh, contraste serif + sans ──────────────────────── */}
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
            <Radio size={11} /> AI trend analysis for creators
          </div>

          {/* Headline — contraste bold sans + serif italic */}
          <h1 style={{
            fontSize: 'clamp(44px, 7.5vw, 82px)', fontWeight: 800, lineHeight: 1.05,
            marginBottom: 8, letterSpacing: '-3px', color: 'var(--text-primary)'
          }}>
            Stalk your niche.
          </h1>
          <h1 className="serif-italic gradient-text" style={{
            fontSize: 'clamp(46px, 8vw, 88px)', fontWeight: 400, lineHeight: 1.05,
            marginBottom: 32, letterSpacing: '-2px', display: 'block'
          }}>
            Own the trend.
          </h1>

          <p style={{
            fontSize: 19, color: 'var(--text-secondary)', maxWidth: 580,
            margin: '0 auto 52px', lineHeight: 1.75, fontWeight: 400
          }}>
            Stalkai analyzes YouTube, Twitch and Reddit to detect what&apos;s trending in your niche.
            One digest every morning. Always one step ahead.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-primary animate-pulse-glow" style={{ fontSize: 16, padding: '15px 32px' }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <PricingLink className="btn-secondary" style={{ fontSize: 16, padding: '15px 28px' }}>
              See pricing
            </PricingLink>
          </div>

          <p className="mono" style={{ marginTop: 22, color: 'var(--text-muted)', fontSize: 12, letterSpacing: '0.04em' }}>
            no credit card · free tier forever
          </p>
        </div>

        {/* Mock UI preview */}
        <div className="lp-mock-preview" style={{ maxWidth: 960, margin: '80px auto 0', position: 'relative', width: '100%' }}>
          <div style={{
            padding: 2, borderRadius: '2rem', overflow: 'hidden',
            border: '1px solid rgba(123,97,255,0.3)',
            boxShadow: '0 0 60px rgba(123,97,255,0.12), 0 40px 80px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 'calc(2rem - 2px)',
              display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 380
            }}>
              {/* Mock sidebar */}
              <div style={{ borderRight: '1px solid var(--border)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 20 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #7B61FF, #e879f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={12} color="white" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Stalk<span style={{ color: '#9d79ff' }}>.ai</span></span>
                </div>
                {[
                  { label: 'Dashboard', active: false },
                  { label: 'Subjects', active: true },
                  { label: 'Digests', active: false },
                  { label: 'Offer Builder', active: false, pro: true },
                  { label: 'Settings', active: false },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    background: item.active ? 'rgba(123,97,255,0.15)' : 'transparent',
                    color: item.active ? '#a78bfa' : 'var(--text-muted)',
                    border: item.active ? '1px solid rgba(123,97,255,0.2)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                  }}>
                    <span>{item.label}</span>
                    {item.pro && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>PRO</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Mock main content */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>My Subjects</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[
                    { name: 'Technology', sources: 4, types: ['#ff4444', '#10b981', '#ff6719', '#e2e8f0'], digest: '12m ago' },
                    { name: 'AI & ML', sources: 3, types: ['#ff4444', '#1690ff', '#ff6314'], digest: '1h ago' },
                    { name: 'Startups', sources: 3, types: ['#ff6314', '#10b981', '#ff6719'], digest: '3h ago' },
                    { name: 'Crypto', sources: 2, types: ['#ff4444', '#ff6600'], digest: 'just now' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: '1rem',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{s.name}</span>
                        <span style={{
                          fontSize: 10, background: 'rgba(123,97,255,0.15)', color: '#a78bfa',
                          border: '1px solid rgba(123,97,255,0.2)', borderRadius: 8, padding: '1px 6px', fontWeight: 600
                        }}>{s.sources} sources</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {s.types.map((c, j) => (
                            <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>digest {s.digest}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini digest preview */}
                <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: '1rem', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>✨ AI Digest — Technology</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>just now</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      '🔥 OpenAI releases GPT-5 with advanced multimodal capabilities',
                      '📈 GitHub Copilot surpasses 2M paid users',
                      '💡 Takeaway: AI continues to dominate the tech news cycle this week.',
                    ].map((line, i) => (
                      <div key={i} style={{ fontSize: 11, color: i === 2 ? '#a78bfa' : 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="lp-section" style={{ padding: '120px 40px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              How it works
            </p>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-1.5px' }}>
              From sources to{' '}
              <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>actionable trends</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 500, margin: '0 auto' }}>
              Stop scrolling. Start creating with intent.
            </p>
          </div>

          <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                icon: <Zap size={24} />,
                title: 'Follow your niche',
                desc: 'Add the YouTube channels, subreddits and Twitch streams that dominate your niche. You decide what sources matter.',
                color: '#f59e0b',
                mono: '01 / FOLLOW YOUR NICHE'
              },
              {
                icon: <Sparkles size={24} />,
                title: 'AI detects patterns',
                desc: 'Stalkai analyzes all the content together and detects which topics, formats and angles are gaining traction this week.',
                color: '#7B61FF',
                mono: '02 / AI DETECTS PATTERNS'
              },
              {
                icon: <Bell size={24} />,
                title: 'You get there first',
                desc: 'Receive a digest every morning with the detected trends and what you can do with them before your competition does.',
                color: '#10b981',
                mono: '03 / YOU GET THERE FIRST'
              },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: 36, position: 'relative', overflow: 'hidden' }}>
                <p className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 24 }}>{f.mono}</p>
                <div style={{
                  width: 52, height: 52, borderRadius: '1.25rem', marginBottom: 24,
                  background: `${f.color}1a`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: f.color,
                  border: `1px solid ${f.color}30`
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.5px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 15 }}>{f.desc}</p>
                <div style={{
                  position: 'absolute', bottom: -40, right: -40,
                  width: 120, height: 120, borderRadius: '50%',
                  background: `radial-gradient(circle, ${f.color}12 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              </div>
            ))}
          </div>

          {/* Platforms */}
          <div style={{ marginTop: 80 }}>
            <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, textAlign: 'center' }}>
              Supported platforms
            </p>

            {/* Free */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, textAlign: 'center' }}>
                Free plan
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { icon: <Youtube size={18} />, name: 'YouTube', color: '#ff4444' },
                  { icon: <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.5px' }}>Bs</span>, name: 'Bluesky', color: '#1690ff' },
                  { icon: <TrendingUp size={18} />, name: 'Hacker News', color: '#ff6600' },
                  { icon: <Rss size={18} />, name: 'RSS / Blogs', color: '#10b981' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 100,
                    color: s.color, fontWeight: 600, fontSize: 14, transition: 'border-color 0.2s'
                  }}>
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, textAlign: 'center' }}>
                ⚡ Pro & Ultra
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { icon: <MessageSquare size={18} />, name: 'Reddit', color: '#ff6314' },
                  { icon: <BookOpen size={18} />, name: 'Substack', color: '#ff6719' },
                  { icon: <Tv size={18} />, name: 'Twitch', color: '#9146ff' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 100,
                    color: s.color, fontWeight: 600, fontSize: 14
                  }}>
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Offer Builder feature highlight ──────────────────────────────── */}
      <section className="lp-section" style={{ padding: '100px 40px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            borderRadius: '2rem', overflow: 'hidden',
            border: '1px solid rgba(16,185,129,0.3)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(52,211,153,0.03) 100%)',
            boxShadow: '0 0 60px rgba(16,185,129,0.06)',
          }}>
            <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #34d399, #7B61FF)' }} />
            <div className="lp-offer-inner" style={{ padding: '56px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

              {/* Left — copy */}
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 100, padding: '5px 14px', marginBottom: 24,
                  fontSize: 11, color: '#10b981', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase'
                }}>
                  <Lightbulb size={11} /> Pro & Ultra exclusive
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                  Turn your niche knowledge into a{' '}
                  <span className="serif-italic" style={{ fontWeight: 400, color: '#34d399' }}>high-ticket offer</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.8, marginBottom: 28, maxWidth: 440 }}>
                  The Offer Builder interviews you across 6 stages to help you discover, structure and price a digital offer from your expertise — course, coaching, community or digital product.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {[
                    'AI interview personalised to your tracked niches',
                    'Covers background, skills, market, format & pricing',
                    'Generates a full Content Business Blueprint',
                    'Save your blueprint to Digests for future reference',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                      <Check size={14} color="#10b981" style={{ flexShrink: 0 }} /> {f}
                    </div>
                  ))}
                </div>
                <Link href="/signup" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  Start building your offer <ArrowRight size={15} />
                </Link>
              </div>

              {/* Right — mock interview UI */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: '1.5rem',
                border: '1px solid rgba(16,185,129,0.25)',
                overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(0,0,0,0.25)'
              }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                <div style={{ padding: '20px 24px' }}>
                  {/* Stage bar */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {['Background', 'Skills', 'Market', 'Offer', 'Validation', 'Positioning'].map((s, i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i < 2 ? '#10b981' : i === 2 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'var(--border)' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                    Stage 3 of 6 — Market Alignment
                  </div>
                  {/* Messages */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '85%' }}>
                      Who would pay to learn what you know? Describe the person who needs your Minecraft content strategy the most.
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '12px 12px 4px 12px', background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.25)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '85%', alignSelf: 'flex-end' }}>
                      Small YouTubers in the gaming niche, 1k–50k subs, who know how to play but struggle with content strategy and growth.
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '85%' }}>
                      Perfect. What would it be worth to them to go from 5k to 50k subscribers in 6 months?
                    </div>
                  </div>
                  {/* Input mock */}
                  <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your answer…</span>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowRight size={11} color="white" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="lp-section" style={{ padding: '120px 40px', borderTop: '1px solid var(--border)', scrollMarginTop: '90px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Pricing
            </p>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-1.5px' }}>
              Simple, honest{' '}
              <span className="serif-italic gradient-text" style={{ fontWeight: 400 }}>pricing</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>Start free, upgrade when you need more.</p>
          </div>

          <div className="lp-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'start' }}>
            {[
              {
                name: 'Free',
                price: '0',
                desc: 'Perfect to get started',
                features: [
                  'Up to 3 sources per subject',
                  'Up to 3 subjects',
                  'YouTube, Bluesky, HN & RSS',
                  'AI digest',
                  'Basic dashboard',
                ],
                cta: 'Start for free',
                href: '/signup',
                highlight: false
              },
              {
                name: 'Pro',
                price: '9',
                desc: 'For creators who need an edge',
                features: [
                  'Up to 15 sources per subject',
                  'Up to 50 subjects',
                  'All platforms (Reddit, Twitch, Substack…)',
                  'Advanced trend analysis (Gemini 2.5)',
                  'Daily digest by email every morning',
                  'Unlimited manual generations',
                  'AI Offer Builder — discover your high-ticket digital offer',
                ],
                cta: 'Get Pro',
                href: '/api/stripe/checkout?plan=pro',
                highlight: true
              },
              {
                name: 'Ultra',
                price: '19',
                desc: 'For serious creators',
                features: [
                  'Unlimited sources per subject',
                  'Unlimited subjects',
                  'All platforms',
                  'Deep Video Analysis — Gemini 2.5 analyzes the full YouTube video: hook, structure, why it worked, what you can replicate',
                  'AI Offer Builder — discover your high-ticket digital offer',
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
                  <p className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-3px' }}>${plan.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>/month</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{plan.desc}</p>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 36 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <Check size={14} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={plan.highlight ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer — dark deep, rounded top, status dot ───────────────── */}
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
          <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Login</Link>
          <Link href="/signup" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign up</Link>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
