import Link from 'next/link'
import { Eye, Zap, Bell, TrendingUp, Youtube, MessageSquare, Rss, Check, ArrowRight, Radio } from 'lucide-react'

export default function HomePage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(7, 7, 15, 0.8)', backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #7c3aed, #e879f9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Eye size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>
            Stalk<span style={{ color: 'var(--accent-bright)' }}>.ai</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" className="btn-secondary" style={{ padding: '8px 16px' }}>
            Log in
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '8px 18px' }}>
            Start free <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="noise-bg" style={{ padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 100, padding: '6px 14px', marginBottom: 32,
            fontSize: 13, color: 'var(--accent-bright)', fontWeight: 500
          }}>
            <Radio size={12} /> AI-powered content monitoring
          </div>

          <h1 className="glow-text" style={{
            fontSize: 'clamp(42px, 7vw, 76px)', fontWeight: 900, lineHeight: 1.1,
            marginBottom: 24, letterSpacing: '-2px'
          }}>
            Monitor Everything.
            <br />
            <span className="gradient-text">Miss Nothing.</span>
          </h1>

          <p style={{
            fontSize: 20, color: 'var(--text-secondary)', maxWidth: 560,
            margin: '0 auto 48px', lineHeight: 1.7, fontWeight: 400
          }}>
            Track YouTube channels, Reddit threads, blogs and more.
            Get AI-generated daily digests so you stay ahead — without the noise.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-primary animate-pulse-glow" style={{ fontSize: 16, padding: '14px 28px' }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <Link href="#pricing" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
              See pricing
            </Link>
          </div>

          <p style={{ marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
            No credit card required · Always free tier available
          </p>
        </div>

        {/* Mock UI preview */}
        <div style={{ maxWidth: 900, margin: '80px auto 0', position: 'relative' }}>
          <div className="card glow" style={{
            padding: 2, borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(124,58,237,0.3)'
          }}>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 14, padding: '20px',
              display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0, minHeight: 340
            }}>
              {/* Sidebar */}
              <div style={{ borderRight: '1px solid var(--border)', padding: '0 16px 0 0' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                  Tracking
                </div>
                {[
                  { icon: <Youtube size={14} />, name: 'Linus Tech Tips', type: 'YouTube', color: '#ff4444' },
                  { icon: <MessageSquare size={14} />, name: 'r/startups', type: 'Reddit', color: '#ff6314' },
                  { icon: <Rss size={14} />, name: 'TechCrunch', type: 'RSS', color: '#10b981' },
                  { icon: <Youtube size={14} />, name: 'MKBHD', type: 'YouTube', color: '#ff4444' },
                  { icon: <MessageSquare size={14} />, name: 'r/SaaS', type: 'Reddit', color: '#ff6314' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 8, marginBottom: 4,
                    background: i === 0 ? 'rgba(124,58,237,0.15)' : 'transparent',
                    border: i === 0 ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent'
                  }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.type}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Content */}
              <div style={{ padding: '0 0 0 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                  Today&apos;s digest
                </div>
                {[
                  { source: 'MKBHD', title: 'The most important video I\'ve made this year', time: '2h ago', badge: 'YouTube' },
                  { source: 'r/startups', title: 'I grew my SaaS from $0 to $10k MRR in 6 months — AMA', time: '4h ago', badge: 'Reddit' },
                  { source: 'TechCrunch', title: 'OpenAI announces new model with 10x reasoning', time: '6h ago', badge: 'RSS' },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '12px', borderRadius: 10, marginBottom: 8,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--accent-bright)', fontWeight: 600 }}>{item.badge}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>@{item.source}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 40px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, letterSpacing: '-1px' }}>
              Your internet, <span className="gradient-text">curated by AI</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>
              Everything you care about, in one smart feed.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                icon: <Zap size={24} />,
                title: 'Real-time monitoring',
                desc: 'We scan your sources continuously. The moment something important drops, you know about it.',
                color: '#f59e0b'
              },
              {
                icon: <TrendingUp size={24} />,
                title: 'AI-powered summaries',
                desc: 'No more reading walls of text. Our AI digests everything and gives you the key takeaways.',
                color: '#7c3aed'
              },
              {
                icon: <Bell size={24} />,
                title: 'Smart alerts',
                desc: 'Get notified only when something truly relevant happens. Zero noise, maximum signal.',
                color: '#10b981'
              },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: 32 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 20,
                  background: `${f.color}22`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: f.color
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Sources row */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              Supports
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              {[
                { icon: <Youtube size={20} />, name: 'YouTube', color: '#ff4444' },
                { icon: <MessageSquare size={20} />, name: 'Reddit', color: '#ff6314' },
                { icon: <Rss size={20} />, name: 'RSS / Blogs', color: '#10b981' },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 100,
                  color: s.color, fontWeight: 600, fontSize: 15
                }}>
                  {s.icon} {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '100px 40px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, letterSpacing: '-1px' }}>
              Simple, honest <span className="gradient-text">pricing</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>Start free, upgrade when you need more.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'start' }}>
            {[
              {
                name: 'Free',
                price: '0',
                desc: 'Perfect for getting started',
                features: ['Up to 5 sources', 'Weekly digest email', 'YouTube, Reddit & RSS', 'Basic dashboard'],
                cta: 'Start for free',
                href: '/signup',
                highlight: false
              },
              {
                name: 'Pro',
                price: '9',
                desc: 'For power users who need more',
                features: ['Up to 50 sources', 'Daily digest email', 'AI-powered summaries', 'Email alerts', 'Priority processing'],
                cta: 'Get Pro',
                href: '/signup',
                highlight: true
              },
              {
                name: 'Ultra',
                price: '19',
                desc: 'Unlimited everything',
                features: ['Unlimited sources', 'Real-time alerts', 'Custom digest schedule', 'API access (coming soon)', 'Priority support'],
                cta: 'Get Ultra',
                href: '/signup',
                highlight: false
              }
            ].map((plan, i) => (
              <div key={i} className={plan.highlight ? 'glow' : 'card'} style={{
                padding: 32, borderRadius: 16,
                border: plan.highlight ? '1px solid rgba(124,58,237,0.5)' : '1px solid var(--border)',
                background: plan.highlight ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(232,121,249,0.05))' : 'var(--bg-card)',
                position: 'relative'
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7c3aed, #e879f9)',
                    color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px',
                    borderRadius: 100, whiteSpace: 'nowrap'
                  }}>
                    Most Popular
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)' }}>${plan.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>/month</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{plan.desc}</p>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 32 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                      <Check size={14} color="var(--success)" /> {f}
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

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: 'var(--text-muted)', fontSize: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Stalk.ai</span>
        </div>
        <span>© 2026 Stalk.ai. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Login</Link>
          <Link href="/signup" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>
    </div>
  )
}
