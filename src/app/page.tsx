import Link from 'next/link'
import {
  Eye, Zap, Bell, TrendingUp, Youtube, MessageSquare, Rss,
  Check, ArrowRight, Radio, Music, Github, BookOpen, Twitter, Instagram, Clock, Sparkles, BookMarked
} from 'lucide-react'

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
          <Link href="/login" className="btn-secondary" style={{ padding: '8px 16px' }}>Log in</Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '8px 18px' }}>
            Start free <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="noise-bg" style={{ padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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
            fontSize: 20, color: 'var(--text-secondary)', maxWidth: 580,
            margin: '0 auto 48px', lineHeight: 1.7, fontWeight: 400
          }}>
            Crea subjects con tus fuentes favoritas — YouTube, Bluesky, RSS, Substack y más.
            Stalk.ai genera resúmenes con IA para que siempre estés al día.
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

        {/* Mock UI preview — new dashboard style */}
        <div style={{ maxWidth: 960, margin: '80px auto 0', position: 'relative' }}>
          <div className="card glow" style={{
            padding: 2, borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(124,58,237,0.3)'
          }}>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 18,
              display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 380
            }}>
              {/* Mock sidebar */}
              <div style={{ borderRight: '1px solid var(--border)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 20 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #7c3aed, #e879f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={12} color="white" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Stalk<span style={{ color: 'var(--accent-bright)' }}>.ai</span></span>
                </div>
                {[
                  { label: 'Dashboard', active: false },
                  { label: 'Subjects', active: true },
                  { label: 'Digests', active: false },
                  { label: 'Settings', active: false },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: item.active ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: item.active ? 'var(--accent-bright)' : 'var(--text-muted)',
                    border: item.active ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                  }}>
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Mock main content */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>My Subjects</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[
                    { name: 'Tech News', sources: 4, types: ['#ff4444', '#10b981', '#ff6719', '#e2e8f0'], digest: '12m ago' },
                    { name: 'AI & ML', sources: 3, types: ['#ff4444', '#1690ff', '#ff6314'], digest: '1h ago' },
                    { name: 'Startups', sources: 3, types: ['#ff6314', '#10b981', '#ff6719'], digest: '3h ago' },
                    { name: 'Crypto', sources: 2, types: ['#ff4444', '#ff6600'], digest: 'just now' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: 10,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{s.name}</span>
                        <span style={{
                          fontSize: 10, background: 'rgba(124,58,237,0.15)', color: 'var(--accent-bright)',
                          border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 600
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
                <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-bright)' }}>✨ AI Digest — Tech News</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>just now</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      '🔥 OpenAI lanza GPT-5 con capacidades multimodales avanzadas',
                      '📈 GitHub Copilot supera los 2M de usuarios de pago',
                      '💡 Takeaway: La IA sigue dominando el ciclo de noticias tech esta semana.',
                    ].map((line, i) => (
                      <div key={i} style={{ fontSize: 11, color: i === 2 ? 'var(--accent-bright)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
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
                title: 'Subjects inteligentes',
                desc: 'Agrupa varias fuentes bajo un mismo tema. Genera un digest unificado de todo lo que importa.',
                color: '#f59e0b'
              },
              {
                icon: <Sparkles size={24} />,
                title: 'Resúmenes con IA',
                desc: 'Sin paredes de texto. La IA extrae los puntos clave con contexto, links y conclusiones.',
                color: '#7c3aed'
              },
              {
                icon: <Bell size={24} />,
                title: 'Siempre actualizado',
                desc: 'Genera digests cuando quieras. Cero ruido, máxima señal — solo lo que de verdad importa.',
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

          {/* Platforms */}
          <div style={{ marginTop: 64 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, textAlign: 'center' }}>
              Plataformas soportadas
            </p>

            {/* Free */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, textAlign: 'center' }}>
                Plan Free
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
                    color: s.color, fontWeight: 600, fontSize: 14
                  }}>
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, textAlign: 'center' }}>
                ⚡ Plan Pro
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { icon: <MessageSquare size={18} />, name: 'Reddit', color: '#ff6314' },
                  { icon: <Music size={18} />, name: 'TikTok', color: '#ff0050' },
                  { icon: <BookOpen size={18} />, name: 'Substack', color: '#ff6719' },
                  { icon: <Github size={18} />, name: 'GitHub', color: '#e2e8f0' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 100,
                    color: s.color, fontWeight: 600, fontSize: 14
                  }}>
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Coming soon */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Clock size={11} /> Próximamente
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { icon: <Twitter size={18} />, name: 'Twitter / X', color: '#1da9f0' },
                  { icon: <Instagram size={18} />, name: 'Instagram', color: '#e1306c' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 100,
                    color: 'var(--text-muted)', fontWeight: 600, fontSize: 14, opacity: 0.6
                  }}>
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
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
                desc: 'Perfecto para empezar',
                features: [
                  'Hasta 3 subjects',
                  'YouTube, Bluesky, HN & RSS',
                  'Digests con IA (modelo lite)',
                  'Dashboard básico',
                ],
                cta: 'Start for free',
                href: '/signup',
                highlight: false
              },
              {
                name: 'Pro',
                price: '9',
                desc: 'Para usuarios que necesitan más',
                features: [
                  'Hasta 50 subjects',
                  'Reddit, TikTok, Substack & GitHub',
                  'Digests con IA avanzada (Gemini 2.5)',
                  'Formato rico con links y contexto',
                  'Acceso prioritario a nuevas plataformas',
                ],
                cta: 'Get Pro',
                href: '/signup',
                highlight: true
              },
              {
                name: 'Ultra',
                price: '19',
                desc: 'Sin límites',
                features: [
                  'Subjects ilimitados',
                  'Todas las plataformas',
                  'IA más potente',
                  'API access (coming soon)',
                  'Soporte prioritario',
                ],
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
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
