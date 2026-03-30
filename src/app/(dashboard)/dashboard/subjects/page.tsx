'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Building2, Loader2, ArrowRight, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Subject {
    id: string
    name: string
    description: string
    created_at: string
    sources?: { count: number }[]
    channels?: { count: number }[]
}

const PLAN_LIMITS: Record<string, number> = { free: 3, pro: 50, ultra: Infinity }

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [createError, setCreateError] = useState('')
    const [plan, setPlan] = useState<string>('free')
    const supabase = createClient()
    const router = useRouter()

    const fetchSubjects = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        if (profile) setPlan(profile.plan)

        const { data } = await supabase
            .from('subjects')
            .select('*, sources(count), channels(count)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) setSubjects(data as Subject[])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchSubjects() }, [fetchSubjects])

    const maxSubjects = PLAN_LIMITS[plan] ?? 3
    const limitReached = subjects.length >= maxSubjects

    async function createSubject() {
        if (!name.trim() || limitReached) return
        setSaving(true)
        setCreateError('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setSaving(false)
            setCreateError('Not authenticated. Please reload and try again.')
            return
        }
        const { data, error } = await supabase
            .from('subjects')
            .insert({ name: name.trim(), description: description.trim(), user_id: user.id })
            .select()
            .single()
        if (!error && data) {
            router.push(`/dashboard/subjects/${data.id}`)
        } else {
            setCreateError(error?.message ?? 'Failed to create subject. Try again.')
            setSaving(false)
        }
    }

    async function deleteSubject(e: React.MouseEvent, id: string) {
        e.preventDefault()
        e.stopPropagation()
        await supabase.from('subjects').delete().eq('id', id)
        setSubjects(prev => prev.filter(s => s.id !== id))
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Subjects</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        Track companies, people, or topics across all their social channels.
                        {' '}{subjects.length} / {plan === 'ultra' ? '∞' : maxSubjects} used.
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <button
                        className="btn-primary"
                        onClick={() => setShowModal(true)}
                        disabled={limitReached}
                        style={{ opacity: limitReached ? 0.5 : 1, cursor: limitReached ? 'not-allowed' : 'pointer' }}
                    >
                        <Plus size={16} /> New subject
                    </button>
                    {limitReached && (
                        <a href="/settings" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                            Upgrade to add more →
                        </a>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : subjects.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '80px 40px',
                    background: 'var(--bg-card)', border: '1px dashed var(--border-bright)', borderRadius: 16
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 18, margin: '0 auto 24px',
                        background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Building2 size={36} color="var(--accent)" />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>No subjects yet</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.7 }}>
                        Create a subject for a company, person, or topic — then add all their social media links.
                        Get a single AI digest covering everything.
                    </p>
                    <button className="btn-primary" onClick={() => setShowModal(true)} style={{ fontSize: 16, padding: '12px 28px' }}>
                        <Plus size={16} /> Create your first subject
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {subjects.map(subject => {
                        const sourceCount = (subject.sources?.[0]?.count ?? 0) + (subject.channels?.[0]?.count ?? 0)
                        return (
                            <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`} style={{ textDecoration: 'none' }}>
                                <div
                                    className="card"
                                    style={{ padding: 24, cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(232,121,249,0.1))',
                                            border: '1px solid rgba(124,58,237,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 20, fontWeight: 800, color: 'var(--accent-bright)'
                                        }}>
                                            {subject.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <button
                                                onClick={e => deleteSubject(e, subject.id)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <ArrowRight size={16} color="var(--text-muted)" />
                                        </div>
                                    </div>
                                    {subject.description === 'Example subject — edit it or delete anytime' && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            fontSize: 10, fontWeight: 700, color: '#f59e0b',
                                            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                                            borderRadius: 4, padding: '2px 7px', marginBottom: 8,
                                            textTransform: 'uppercase', letterSpacing: 0.5,
                                        }}>
                                            Example · Edit or delete anytime
                                        </div>
                                    )}
                                    <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{subject.name}</div>
                                    {subject.description && subject.description !== 'Example subject — edit it or delete anytime' && (
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                                            {subject.description}
                                        </p>
                                    )}
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                        <span style={{
                                            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                                            borderRadius: 100, padding: '3px 10px', color: 'var(--accent-bright)', fontWeight: 600
                                        }}>
                                            {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
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
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>New subject</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
                            A subject is a company, person, or topic you want to monitor across all their channels.
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Name *
                            </label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && createSubject()}
                                placeholder="e.g. ABB, Tesla, OpenAI..."
                                className="input"
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Description (optional)
                            </label>
                            <input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="e.g. Swiss energy & robotics company"
                                className="input"
                            />
                        </div>

                        {createError && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                                color: '#fca5a5', fontSize: 13
                            }}>
                                {createError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={createSubject}
                                disabled={saving || !name.trim()}
                                style={{ flex: 1, justifyContent: 'center', opacity: saving || !name.trim() ? 0.7 : 1 }}
                            >
                                {saving ? <><Loader2 size={14} /> Creating...</> : <><Plus size={15} /> Create & add sources</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
