import { createClient } from '@/lib/supabase/server'
import { Plus, TrendingUp, Zap, BookOpen, FileText, ArrowRight, Layers, Sparkles } from 'lucide-react'
import Link from 'next/link'
import OnboardingModal from './OnboardingModal'
import SeedExample from './SeedExample'

const typeColor: Record<string, string> = {
    youtube: '#ff4444',
    reddit: '#ff6314',
    bluesky: '#0285FF',
    tiktok: '#000000',
    substack: '#ff6719',
    github: '#e2e8f0',
    twitter: '#1d9bf0',
}

const typeLabel: Record<string, string> = {
    youtube: 'YouTube',
    reddit: 'Reddit',
    bluesky: 'Bluesky',
    tiktok: 'TikTok',
    substack: 'Substack',
    github: 'GitHub',
    twitter: 'Twitter/X',
}

interface Subject {
    id: string
    name: string
    description: string | null
    created_at: string
    source_count: number
    source_types: string[]
    last_digest_at: string | null
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

    // Enrich subjects with source counts and last digest
    const subjects: Subject[] = await Promise.all(
        (subjectsRaw ?? []).map(async (s) => {
            const [{ data: sources }, { data: lastDigest }] = await Promise.all([
                supabase.from('sources').select('type').eq('subject_id', s.id),
                supabase.from('digests').select('created_at').eq('subject_id', s.id)
                    .order('created_at', { ascending: false }).limit(1),
            ])
            return {
                ...s,
                source_count: sources?.length ?? 0,
                source_types: [...new Set((sources ?? []).map((src) => src.type))],
                last_digest_at: lastDigest?.[0]?.created_at ?? null,
            }
        })
    )

    const plan = profile?.plan || 'free'
    const isPro = plan === 'pro' || plan === 'ultra'
    const username = user?.email?.split('@')[0] ?? ''

    const isNewUser = (subjectsCount ?? 0) === 0

    return (
        <div>
            <OnboardingModal isNewUser={isNewUser} />
            <SeedExample shouldSeed={isNewUser} />
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                        Hey, {username} 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        {(subjectsCount ?? 0) === 0
                            ? "Let's get you set up — create your first subject below."
                            : `You're tracking ${subjectsCount} subject${(subjectsCount ?? 0) !== 1 ? 's' : ''}. ${(digestsThisWeek ?? 0) > 0 ? `${digestsThisWeek} digest${(digestsThisWeek ?? 0) !== 1 ? 's' : ''} generated this week.` : 'Generate a digest to catch up.'}`
                        }
                    </p>
                </div>
                <Link href="/dashboard/subjects" className="btn-primary">
                    <Plus size={16} /> New subject
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
                {[
                    { label: 'Subjects', value: subjectsCount ?? 0, icon: <Layers size={20} />, color: '#7c3aed', href: '/dashboard/subjects' },
                    { label: 'Digests this week', value: digestsThisWeek ?? 0, icon: <TrendingUp size={20} />, color: '#f59e0b', href: '/dashboard/digests' },
                    { label: 'Current plan', value: plan.toUpperCase(), icon: <Zap size={20} />, color: '#e879f9', href: isPro ? undefined : 'https://stalk-ai.com/#pricing' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: `${stat.color}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: stat.color
                            }}>
                                {stat.icon}
                            </div>
                            {stat.href && (
                                <Link href={stat.href} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                    <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>
                        <div className="dash-stat-value" style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{stat.value}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="dash-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
                <Link href="/dashboard/subjects" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{
                        padding: 24, cursor: 'pointer', transition: 'border-color 0.15s',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(232,121,249,0.05) 100%)',
                        border: '1px solid rgba(124,58,237,0.25)',
                        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 20
                    }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                            background: 'linear-gradient(135deg, #7c3aed, #e879f9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <BookOpen size={24} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>My Subjects</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                Manage topics and generate digests
                            </div>
                        </div>
                        <ArrowRight size={18} color="var(--text-muted)" />
                    </div>
                </Link>

                <Link href="/dashboard/digests" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{
                        padding: 24, cursor: 'pointer', transition: 'border-color 0.15s',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(16,185,129,0.05) 100%)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 20
                    }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                            background: 'linear-gradient(135deg, #f59e0b, #10b981)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FileText size={24} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>All Digests</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                {(totalDigests ?? 0) > 0 ? `${totalDigests} digest${(totalDigests ?? 0) !== 1 ? 's' : ''} generated total` : 'Browse your AI summaries'}
                            </div>
                        </div>
                        <ArrowRight size={18} color="var(--text-muted)" />
                    </div>
                </Link>
            </div>

            {/* Subjects preview or empty state */}
            {(subjectsCount ?? 0) === 0 ? (
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
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.7, fontSize: 14 }}>
                        A subject is a topic you want to track — add sources like YouTube channels, RSS feeds, or Bluesky accounts and get AI-powered digests.
                    </p>
                    <Link href="/dashboard/subjects" className="btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
                        <Plus size={16} /> Create subject
                    </Link>
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Your subjects</h2>
                        <Link href="/dashboard/subjects" style={{ color: 'var(--accent-bright)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                        {subjects.map((subject) => (
                            <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{
                                    padding: 20, borderRadius: 12, cursor: 'pointer',
                                    transition: 'border-color 0.15s',
                                    height: '100%', boxSizing: 'border-box',
                                    display: 'flex', flexDirection: 'column', gap: 12
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, paddingRight: 8 }}>
                                            {subject.description === 'Example subject — edit it or delete anytime' && (
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    fontSize: 10, fontWeight: 700, color: '#f59e0b',
                                                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                                                    borderRadius: 4, padding: '2px 7px', marginBottom: 6,
                                                    textTransform: 'uppercase', letterSpacing: 0.5,
                                                }}>
                                                    Example · Edit or delete anytime
                                                </div>
                                            )}
                                            <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1.3 }}>
                                                {subject.name}
                                            </h3>
                                        </div>
                                        <div style={{
                                            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)',
                                            borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'var(--accent-bright)',
                                            fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0
                                        }}>
                                            {subject.source_count} source{subject.source_count !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    {subject.description && (
                                        <p style={{
                                            color: 'var(--text-muted)', fontSize: 13, margin: 0,
                                            lineHeight: 1.5, flex: 1,
                                            overflow: 'hidden', display: '-webkit-box',
                                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                        }}>
                                            {subject.description}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                        {/* Source type dots */}
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            {subject.source_types.slice(0, 5).map((type) => (
                                                <div key={type} title={typeLabel[type] ?? type} style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: typeColor[type] ?? '#7c3aed',
                                                    flexShrink: 0
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {subject.last_digest_at
                                                ? `digest ${timeAgo(subject.last_digest_at)}`
                                                : 'no digests yet'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Upgrade CTA for free users */}
            {!isPro && (subjectsCount ?? 0) > 0 && (
                <div style={{
                    marginTop: 32, borderRadius: 14, padding: '24px 28px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(232,121,249,0.08) 100%)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Zap size={16} color="#e879f9" />
                            <span style={{ fontWeight: 700, fontSize: 15 }}>Upgrade to Pro</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                            Unlock Reddit, TikTok, Substack, GitHub tracking + up to 50 subjects + richer AI digests.
                        </p>
                    </div>
                    <Link href="https://stalk-ai.com/#pricing" style={{
                        background: 'linear-gradient(135deg, #7c3aed, #e879f9)',
                        color: 'white', borderRadius: 8, padding: '10px 20px',
                        fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                        See plans →
                    </Link>
                </div>
            )}
        </div>
    )
}
