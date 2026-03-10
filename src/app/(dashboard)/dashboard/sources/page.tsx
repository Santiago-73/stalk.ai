'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Youtube, MessageSquare, Rss, Trash2, Radio, Loader2, RefreshCw, CheckCircle, Twitter, TrendingUp, Music } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SourceType = 'youtube' | 'reddit' | 'rss' | 'twitter' | 'bluesky' | 'hackernews' | 'tiktok'

interface Source {
    id: string
    name: string
    type: SourceType
    url: string
}

const typeConfig: Record<SourceType, { icon: React.ReactNode; color: string; label: string; placeholder: string }> = {
    youtube: {
        icon: <Youtube size={16} />,
        color: '#ff4444',
        label: 'YouTube',
        placeholder: 'https://youtube.com/@channelname'
    },
    reddit: {
        icon: <MessageSquare size={16} />,
        color: '#ff6314',
        label: 'Reddit',
        placeholder: 'https://reddit.com/r/subredditname'
    },
    twitter: {
        icon: <Twitter size={16} />,
        color: '#1da9f0',
        label: 'Twitter/X',
        placeholder: 'https://twitter.com/@username'
    },
    bluesky: {
        icon: <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px' }}>Bs</span>,
        color: '#0285FF',
        label: 'Bluesky',
        placeholder: 'https://bsky.app/profile/username'
    },
    hackernews: {
        icon: <span style={{ fontWeight: 800, fontSize: 13, background: '#ff6600', color: '#fff', padding: '0 3px' }}>Y</span>,
        color: '#ff6600',
        label: 'Hacker News',
        placeholder: 'https://news.ycombinator.com'
    },
    tiktok: {
        icon: <Music size={16} />,
        color: '#ff0050',
        label: 'TikTok',
        placeholder: 'https://tiktok.com/@username'
    },
    rss: {
        icon: <Rss size={16} />,
        color: '#10b981',
        label: 'RSS / Blog',
        placeholder: 'https://example.com/feed.xml'
    }
}

export default function SourcesPage() {
    const [sources, setSources] = useState<Source[]>([])
    const [showModal, setShowModal] = useState(false)
    const [selectedType, setSelectedType] = useState<SourceType>('youtube')
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generatingId, setGeneratingId] = useState<string | null>(null)
    const [toastId, setToastId] = useState<string | null>(null)
    const [toastError, setToastError] = useState<string | null>(null)
    const supabase = createClient()
    const [plan, setPlan] = useState<'free' | 'pro' | 'ultra'>('free')

    const fetchSources = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch plan
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        if (profile) setPlan(profile.plan as 'free' | 'pro' | 'ultra')

        const { data } = await supabase
            .from('sources')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        if (data) setSources(data as Source[])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchSources() }, [fetchSources])

    const maxSources = plan === 'ultra' ? Infinity : plan === 'pro' ? 50 : 5
    const limitReached = sources.length >= maxSources

    async function addSource() {
        if (!name.trim() || !url.trim() || limitReached) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
            .from('sources')
            .insert({ name: name.trim(), type: selectedType, url: url.trim(), user_id: user.id })
            .select()
            .single()
        if (!error && data) setSources(prev => [data as Source, ...prev])
        setName('')
        setUrl('')
        setShowModal(false)
        setSaving(false)
    }

    async function removeSource(id: string) {
        await supabase.from('sources').delete().eq('id', id)
        setSources(prev => prev.filter(s => s.id !== id))
    }

    async function generateDigest(source: Source) {
        setGeneratingId(source.id)
        setToastError(null)
        try {
            const res = await fetch('/api/fetch-source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_id: source.id }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Failed')
            setToastId(source.id)
            setTimeout(() => setToastId(null), 3000)
        } catch (err: unknown) {
            setToastError(err instanceof Error ? err.message : 'Error generating digest')
            setTimeout(() => setToastError(null), 4000)
        } finally {
            setGeneratingId(null)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Sources</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        Manage what you&apos;re tracking. {sources.length} / {plan === 'ultra' ? '∞' : maxSources} sources used.
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <button
                        className="btn-primary"
                        onClick={() => setShowModal(true)}
                        disabled={limitReached}
                        style={{ opacity: limitReached ? 0.5 : 1, cursor: limitReached ? 'not-allowed' : 'pointer' }}
                    >
                        <Plus size={16} /> Add source
                    </button>
                    {limitReached && (
                        <a href="/settings" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                            Upgrade to add more →
                        </a>
                    )}
                </div>
            </div>

            {/* Toast notifications */}
            {toastId && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                    color: '#6ee7b7', fontWeight: 600, fontSize: 14,
                    backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    animation: 'slideIn 0.3s ease'
                }}>
                    <CheckCircle size={18} /> Digest generated! Check the dashboard.
                </div>
            )}
            {toastError && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 12, padding: '14px 20px',
                    color: '#fca5a5', fontWeight: 600, fontSize: 14,
                    backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                    ⚠ {toastError}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : sources.length === 0 ? (
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
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Add your first source</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.7 }}>
                        Track YouTube channels, Reddit communities, or any RSS/blog feed.
                    </p>
                    <button className="btn-primary" onClick={() => setShowModal(true)} style={{ fontSize: 16, padding: '12px 28px' }}>
                        <Plus size={16} /> Get started
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {sources.map(source => {
                        const config = typeConfig[source.type] ?? typeConfig.rss
                        const isGenerating = generatingId === source.id
                        const justDone = toastId === source.id
                        return (
                            <div key={source.id} className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: `${config.color}22`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: config.color
                                    }}>
                                        {config.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{source.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{source.url}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
                                        background: `${config.color}22`, color: config.color
                                    }}>
                                        {config.label}
                                    </span>
                                    {/* Generate digest button */}
                                    <button
                                        onClick={() => generateDigest(source)}
                                        disabled={isGenerating}
                                        title="Generate AI digest"
                                        style={{
                                            background: justDone ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
                                            border: `1px solid ${justDone ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.3)'}`,
                                            borderRadius: 8, cursor: isGenerating ? 'default' : 'pointer',
                                            color: justDone ? '#6ee7b7' : 'var(--accent-bright)',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '6px 12px', fontSize: 12, fontWeight: 600,
                                            transition: 'all 0.15s', opacity: isGenerating ? 0.7 : 1,
                                            fontFamily: 'inherit'
                                        }}
                                    >
                                        {isGenerating
                                            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                                            : justDone
                                                ? <><CheckCircle size={13} /> Done!</>
                                                : <><RefreshCw size={13} /> Generate digest</>}
                                    </button>
                                    <button
                                        onClick={() => removeSource(source.id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 6,
                                            transition: 'color 0.15s'
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div className="card" onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 480, padding: 32, borderRadius: 20,
                        border: '1px solid var(--border-bright)'
                    }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Add new source</h2>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Source type
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                                {(Object.keys(typeConfig) as SourceType[]).map(type => {
                                    const c = typeConfig[type]
                                    const active = selectedType === type
                                    const unstable = type === 'reddit' || type === 'tiktok'
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            style={{
                                                padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                background: active ? `${c.color}22` : 'var(--bg-secondary)',
                                                border: `1px solid ${active ? c.color : 'var(--border)'}`,
                                                color: active ? c.color : 'var(--text-muted)',
                                                transition: 'all 0.15s', fontFamily: 'inherit',
                                                position: 'relative'
                                            }}
                                        >
                                            {unstable && (
                                                <span style={{
                                                    position: 'absolute', top: 5, right: 5,
                                                    fontSize: 9, lineHeight: 1
                                                }}>⚠️</span>
                                            )}
                                            {c.icon}
                                            <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            {(selectedType === 'reddit' || selectedType === 'tiktok') && (
                                <div style={{
                                    marginTop: 10, padding: '10px 14px', borderRadius: 10,
                                    background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)',
                                    fontSize: 12, color: '#ca8a04', lineHeight: 1.5
                                }}>
                                    ⚠️ <strong>{typeConfig[selectedType].label}</strong> puede ser inestable — estas plataformas bloquean peticiones de servidores cloud con frecuencia. Puede fallar ocasionalmente.
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Name
                            </label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Linus Tech Tips"
                                className="input"
                            />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                URL
                            </label>
                            <input
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder={typeConfig[selectedType].placeholder}
                                className="input"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={addSource} disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                                {saving ? <><Loader2 size={14} /> Saving...</> : <><Plus size={15} /> Add source</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    )
}
