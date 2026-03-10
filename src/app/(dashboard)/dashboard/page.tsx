import { createClient } from '@/lib/supabase/server'
import { Plus, Radio, FileText, TrendingUp, Zap, Youtube, MessageSquare, Rss, Clock } from 'lucide-react'
import Link from 'next/link'

const typeIcon: Record<string, React.ReactNode> = {
    youtube: <Youtube size={14} />,
    reddit: <MessageSquare size={14} />,
    bluesky: <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: '-0.5px' }}>Bs</span>,
    hackernews: <span style={{ fontWeight: 800, fontSize: 11, background: '#ff6600', color: '#fff', padding: '0 2px' }}>Y</span>,
    rss: <Rss size={14} />,
}
const typeColor: Record<string, string> = {
    youtube: '#ff4444',
    reddit: '#ff6314',
    bluesky: '#0285FF',
    hackernews: '#ff6600',
    rss: '#10b981',
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

interface Digest {
    id: string
    source_name: string
    source_type: string
    content: string
    created_at: string
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get profile plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user?.id ?? '')
        .single()

    // 2. Get total sources
    const { count: sourcesCount } = await supabase
        .from('sources')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id ?? '')

    // 3. Get total digests and latest 10
    const { data: digestsRaw, count: digestsCount } = await supabase
        .from('digests')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(10)

    // 4. Get digests this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const { count: digestsThisWeek } = await supabase
        .from('digests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id ?? '')
        .gte('created_at', oneWeekAgo.toISOString())

    const digests: Digest[] = (digestsRaw ?? []) as Digest[]

    const stats = [
        { label: 'Sources tracking', value: sourcesCount ?? 0, icon: <Radio size={20} />, color: '#7c3aed' },
        { label: 'Total digests', value: digestsCount ?? 0, icon: <FileText size={20} />, color: '#10b981' },
        { label: 'Digests this week', value: digestsThisWeek ?? 0, icon: <TrendingUp size={20} />, color: '#f59e0b' },
        { label: 'Current Plan', value: (profile?.plan || 'free').toUpperCase(), icon: <Zap size={20} />, color: '#e879f9' },
    ]

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Here&apos;s what&apos;s happening.
                    </p>
                </div>
                <Link href="/dashboard/sources" className="btn-primary">
                    <Plus size={16} /> Add source
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: `${stat.color}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: stat.color
                            }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{stat.value}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Digest feed or empty states */}
            {(sourcesCount ?? 0) === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '80px 40px',
                    background: 'var(--bg-card)', border: '1px dashed var(--border-bright)',
                    borderRadius: 16
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 18, margin: '0 auto 24px',
                        background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Radio size={36} color="var(--accent)" />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>No sources yet</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.7 }}>
                        Add your first source to start tracking YouTube channels, Reddit communities, or RSS feeds.
                    </p>
                    <Link href="/dashboard/sources" className="btn-primary" style={{ fontSize: 16, padding: '12px 28px' }}>
                        <Plus size={16} /> Add your first source
                    </Link>
                </div>
            ) : digests.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 40px',
                    background: 'var(--bg-card)', border: '1px dashed var(--border-bright)',
                    borderRadius: 16
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
                        background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <FileText size={30} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>No digests yet</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6, fontSize: 14 }}>
                        You have sources set up — go to Sources and click <strong style={{ color: 'var(--text-primary)' }}>&ldquo;Generate digest&rdquo;</strong> on any of them.
                    </p>
                    <Link href="/dashboard/sources" className="btn-primary" style={{ fontSize: 15, padding: '10px 24px' }}>
                        Go to Sources →
                    </Link>
                </div>
            ) : (
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Recent digests</h2>
                    <div style={{ display: 'grid', gap: 16 }}>
                        {digests.map(digest => {
                            const color = typeColor[digest.source_type] ?? '#7c3aed'
                            const icon = typeIcon[digest.source_type] ?? <FileText size={14} />
                            // Parse bullet points
                            const bullets = digest.content
                                .split('\n')
                                .map(l => l.trim())
                                .filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
                                .map(l => l.replace(/^[•\-*]\s*/, ''))
                            return (
                                <div key={digest.id} className="card" style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                background: `${color}22`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color
                                            }}>
                                                {icon}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{digest.source_name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{digest.source_type}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                                            <Clock size={12} />
                                            {timeAgo(digest.created_at)}
                                        </div>
                                    </div>
                                    {bullets.length > 0 ? (
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                                            {bullets.map((bullet, i) => (
                                                <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                                    <span style={{ color, marginTop: 1, flexShrink: 0 }}>•</span>
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-line', margin: 0 }}>{digest.content}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
