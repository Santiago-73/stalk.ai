'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import {
    Plus, Loader2, Trash2, RefreshCw, CheckCircle, ArrowLeft,
    Youtube, MessageSquare, Zap, Flame, ChevronDown,
    Twitch
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DigestCard from '@/app/(dashboard)/dashboard/digests/DigestCard'
import ChannelSearch from '@/app/(dashboard)/_components/ChannelSearch'
import ChannelList from '@/app/(dashboard)/_components/ChannelList'
import ChannelVideos from '@/app/(dashboard)/_components/ChannelVideos'
import DetectTrendsButton from '@/app/(dashboard)/_components/DetectTrendsButton'

type SourceType = 'youtube' | 'reddit' | 'twitch'

interface Source {
    id: string
    name: string
    type: SourceType
    url: string
    subject_id: string
}

interface Digest {
    id: string
    content: string
    created_at: string
    source_type: string
    source_name: string
    metadata?: { thumbnails?: { title: string; thumb: string; permalink: string; score: number }[] } | null
}

interface Subject {
    id: string
    name: string
    description: string
}

const typeConfig: Record<SourceType, { icon: React.ReactNode; color: string; label: string; placeholder: string; proOnly?: boolean }> = {
    youtube: { icon: <Youtube size={15} />,       color: '#ff4444', label: 'YouTube', placeholder: 'https://youtube.com/@channelname' },
    reddit:  { icon: <MessageSquare size={15} />, color: '#ff6314', label: 'Reddit',  placeholder: 'https://reddit.com/r/subreddit', proOnly: true },
    twitch:  { icon: <Twitch size={15} />,        color: '#9146ff', label: 'Twitch',  placeholder: 'https://twitch.tv/username',     proOnly: true },
}


export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const [subject, setSubject] = useState<Subject | null>(null)
    const [sources, setSources] = useState<Source[]>([])
    const [digests, setDigests] = useState<Digest[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [toastOk, setToastOk] = useState(false)
    const [toastError, setToastError] = useState<string | null>(null)
    const [plan, setPlan] = useState<string>('free')

    const [channelRefreshKey, setChannelRefreshKey] = useState(0)
    const [digestsOpen, setDigestsOpen] = useState(false)

    // Add source modal
    const [showModal, setShowModal] = useState(false)
    const [selectedType, setSelectedType] = useState<SourceType>('youtube')
    const [srcName, setSrcName] = useState('')
    const [srcUrl, setSrcUrl] = useState('')
    const [saving, setSaving] = useState(false)

    const supabase = createClient()

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [subjectRes, sourcesRes, digestsRes, profileRes] = await Promise.all([
            supabase.from('subjects').select('*').eq('id', id).eq('user_id', user.id).single(),
            supabase.from('sources').select('*').eq('subject_id', id).order('created_at', { ascending: true }),
            supabase.from('digests').select('*').eq('subject_id', id).order('created_at', { ascending: false }).limit(10),
            supabase.from('profiles').select('plan').eq('id', user.id).single(),
        ])

        if (subjectRes.data) setSubject(subjectRes.data as Subject)
        if (sourcesRes.data) setSources(sourcesRes.data as Source[])
        if (digestsRes.data) setDigests(digestsRes.data as Digest[])
        if (profileRes.data) setPlan(profileRes.data.plan ?? 'free')
        setLoading(false)
    }, [supabase, id])

    useEffect(() => { fetchData() }, [fetchData])

    const maxSourcesPerSubject = plan === 'ultra' ? Infinity : plan === 'pro' ? 15 : 3
    const sourceLimitReached = sources.length >= maxSourcesPerSubject

    async function addSource() {
        if (!srcName.trim() || !srcUrl.trim() || sourceLimitReached) return
        setSaving(true)
        try {
            const res = await fetch('/api/add-source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: srcName.trim(), type: selectedType, url: srcUrl.trim(), subject_id: id }),
            })
            const json = await res.json()
            if (!res.ok) {
                setToastError(json.error ?? 'Failed to add source')
                setTimeout(() => setToastError(null), 5000)
                if (json.limit_reached) setShowModal(false)
                return
            }
            setSources(prev => [...prev, json.source as Source])
            setSrcName('')
            setSrcUrl('')
            setShowModal(false)
        } finally {
            setSaving(false)
        }
    }

    async function removeSource(sourceId: string) {
        await supabase.from('sources').delete().eq('id', sourceId)
        setSources(prev => prev.filter(s => s.id !== sourceId))
    }

    async function generateDigest() {
        setGenerating(true)
        setToastError(null)
        try {
            const res = await fetch('/api/fetch-subject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject_id: id }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Failed')
            setDigests(prev => [json.digest, ...prev])
            setToastOk(true)
            setTimeout(() => setToastOk(false), 3000)
        } catch (err: unknown) {
            setToastError(err instanceof Error ? err.message : 'Error generating digest')
            setTimeout(() => setToastError(null), 4000)
        } finally {
            setGenerating(false)
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    if (!subject) return (
        <div style={{ textAlign: 'center', padding: 80 }}>
            <p style={{ color: 'var(--text-muted)' }}>Subject not found.</p>
            <Link href="/dashboard/subjects" className="btn-secondary" style={{ marginTop: 16, display: 'inline-flex' }}>
                ← Back to Subjects
            </Link>
        </div>
    )

    return (
        <div>
            {/* Toasts */}
            {toastOk && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                    color: '#6ee7b7', fontWeight: 600, fontSize: 14, backdropFilter: 'blur(8px)'
                }}>
                    <CheckCircle size={18} /> Digest generated!
                </div>
            )}
            {toastError && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 12, padding: '14px 20px', color: '#fca5a5', fontWeight: 600, fontSize: 14,
                    backdropFilter: 'blur(8px)'
                }}>
                    ⚠ {toastError}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 36 }}>
                <Link href="/dashboard/subjects" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 20,
                    transition: 'color 0.15s'
                }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                    <ArrowLeft size={14} /> Subjects
                </Link>

                <div className="subject-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(232,121,249,0.1))',
                            border: '1px solid rgba(124,58,237,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, fontWeight: 900, color: 'var(--accent-bright)'
                        }}>
                            {subject.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{subject.name}</h1>
                            {subject.description && (
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{subject.description}</p>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <DetectTrendsButton subjectId={id} />
                        <button
                            className="btn-primary"
                            onClick={generateDigest}
                            disabled={generating || sources.length === 0}
                            style={{ opacity: (generating || sources.length === 0) ? 0.6 : 1 }}
                        >
                            {generating
                                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                                : <><RefreshCw size={15} /> Generate digest</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Digests — collapsible */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 8 }}>
                <button
                    onClick={() => setDigestsOpen(o => !o)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-primary)', fontFamily: 'inherit',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} color="var(--accent-bright)" />
                        <span style={{ fontSize: 15, fontWeight: 700 }}>Digests ({digests.length})</span>
                    </div>
                    <ChevronDown size={16} color="var(--text-muted)" style={{
                        transform: digestsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }} />
                </button>

                {digestsOpen && (
                    <div style={{ padding: '0 20px 20px' }}>
                        {digests.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                                Hit &quot;Generate digest&quot; to get your first unified summary.
                            </p>
                        ) : (
                            <div className="subject-digests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {digests.map(digest => (
                                    <DigestCard key={digest.id} digest={digest} userPlan={plan} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* YouTube Channels */}
            <div style={{ marginTop: 40 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Youtube size={18} color="#ff4444" /> YouTube Channels
                </h2>
                <ChannelSearch
                    subjectId={id}
                    onChannelAdded={() => setChannelRefreshKey(k => k + 1)}
                />
                <div style={{ marginTop: 20 }}>
                    <ChannelList subjectId={id} refreshKey={channelRefreshKey} />
                </div>
            </div>

            {/* Recent Videos */}
            <div style={{ marginTop: 40 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flame size={18} color="#ff4444" /> Recent Videos
                </h2>
                <ChannelVideos subjectId={id} refreshKey={channelRefreshKey} />
            </div>

            {/* Add source modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div className="card subject-modal" onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 500, padding: 32, borderRadius: 20,
                        border: '1px solid var(--border-bright)'
                    }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Add source to {subject.name}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                            Add a social media link or feed that belongs to this subject.
                        </p>

                        {/* Type selector */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Platform
                            </label>
                            {/* Free platforms */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                                {(Object.keys(typeConfig) as SourceType[]).filter(t => !typeConfig[t].proOnly).map(type => {
                                    const c = typeConfig[type]
                                    const active = selectedType === type
                                    return (
                                        <button key={type} onClick={() => setSelectedType(type)} style={{
                                            padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                            background: active ? `${c.color}22` : 'var(--bg-secondary)',
                                            border: `1px solid ${active ? c.color : 'var(--border)'}`,
                                            color: active ? c.color : 'var(--text-muted)',
                                            transition: 'all 0.15s', fontFamily: 'inherit',
                                        }}>
                                            {c.icon}
                                            <span style={{ fontSize: 10, fontWeight: 600 }}>{c.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            {/* Pro-only platforms */}
                            <div style={{ marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        <Zap size={10} style={{ display: 'inline', marginRight: 3 }} />Pro
                                    </span>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(251,191,36,0.2)' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative' }}>
                                    {(Object.keys(typeConfig) as SourceType[]).filter(t => typeConfig[t].proOnly).map(type => {
                                        const c = typeConfig[type]
                                        const active = selectedType === type
                                        const locked = plan === 'free'
                                        const unstable = type === 'reddit'
                                        return (
                                            <button key={type}
                                                onClick={() => !locked && setSelectedType(type)}
                                                title={locked ? 'Upgrade to Pro to unlock' : undefined}
                                                style={{
                                                    padding: '10px 6px', borderRadius: 10,
                                                    cursor: locked ? 'not-allowed' : 'pointer',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                                    background: locked ? 'var(--bg-secondary)' : active ? `${c.color}22` : 'var(--bg-secondary)',
                                                    border: `1px solid ${locked ? 'var(--border)' : active ? c.color : 'rgba(251,191,36,0.25)'}`,
                                                    color: locked ? 'var(--text-muted)' : active ? c.color : 'var(--text-muted)',
                                                    opacity: locked ? 0.5 : 1,
                                                    transition: 'all 0.15s', fontFamily: 'inherit', position: 'relative',
                                                }}>
                                                {unstable && !locked && (
                                                    <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 9 }}>⚠️</span>
                                                )}
                                                {locked && (
                                                    <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 9 }}>🔒</span>
                                                )}
                                                {c.icon}
                                                <span style={{ fontSize: 10, fontWeight: 600 }}>{c.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            {plan === 'free' && (
                                <a href="/settings" style={{
                                    display: 'block', marginTop: 8, padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                                    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                                    fontSize: 11, color: '#fbbf24', textDecoration: 'none', fontWeight: 600
                                }}>
                                    ⚡ Upgrade to Pro to unlock Reddit & Twitch →
                                </a>
                            )}
                            {plan !== 'free' && selectedType === 'reddit' && (
                                <div style={{
                                    marginTop: 6, padding: '8px 12px', borderRadius: 8,
                                    background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)',
                                    fontSize: 11, color: '#ca8a04', lineHeight: 1.5
                                }}>
                                    ⚠️ <strong>{typeConfig[selectedType].label}</strong> may be unstable — this platform frequently blocks requests from cloud servers.
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Name
                            </label>
                            <input
                                value={srcName}
                                onChange={e => setSrcName(e.target.value)}
                                placeholder={`e.g. ${subject.name} ${typeConfig[selectedType].label}`}
                                className="input"
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                URL
                            </label>
                            <input
                                value={srcUrl}
                                onChange={e => setSrcUrl(e.target.value)}
                                placeholder={typeConfig[selectedType].placeholder}
                                className="input"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={addSource}
                                disabled={saving || !srcName.trim() || !srcUrl.trim()}
                                style={{ flex: 1, justifyContent: 'center', opacity: saving || !srcName.trim() || !srcUrl.trim() ? 0.7 : 1 }}
                            >
                                {saving ? <><Loader2 size={14} /> Adding...</> : <><Plus size={14} /> Add source</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
