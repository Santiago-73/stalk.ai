'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lightbulb, Send, Loader2, Copy, Check, BookmarkPlus, Lock, ArrowRight, Sparkles } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface Subject {
    id: string
    name: string
}

const STAGE_LABELS = ['Background', 'Skills', 'Market', 'Offer', 'Validation', 'Positioning']

/** Parse **bold** inline markdown into React nodes */
function parseInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    const regex = /\*\*([^*]+)\*\*/g
    let last = 0, m, k = 0
    while ((m = regex.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index))
        parts.push(<strong key={k++} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{m[1]}</strong>)
        last = regex.lastIndex
    }
    if (last < text.length) parts.push(text.slice(last))
    return <>{parts}</>
}

function BlueprintContent({ content }: { content: string }) {
    const lines = content.split('\n').filter(l => l.trim())
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lines.map((line, i) => {
                const t = line.trim()
                // Skip the title line
                if (t === '**CONTENT BUSINESS BLUEPRINT**') {
                    return null
                }
                // Section label: **Label:** value
                const sectionMatch = t.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)
                if (sectionMatch) {
                    return (
                        <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                                {sectionMatch[1]}
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {parseInline(sectionMatch[2])}
                            </div>
                        </div>
                    )
                }
                return (
                    <p key={i} style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {parseInline(t)}
                    </p>
                )
            })}
        </div>
    )
}

export default function OfferBuilderPage() {
    const [plan, setPlan] = useState<string>('free')
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [initLoading, setInitLoading] = useState(true)
    const [stage, setStage] = useState<number>(0) // 0 = not started
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [blueprint, setBlueprint] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toastError, setToastError] = useState<string | null>(null)
    const [toastOk, setToastOk] = useState(false)
    const supabase = createClient()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const [profileRes, subjectsRes] = await Promise.all([
                supabase.from('profiles').select('plan').eq('id', user.id).single(),
                supabase.from('subjects').select('id, name').eq('user_id', user.id).order('created_at', { ascending: true }),
            ])
            setPlan(profileRes.data?.plan ?? 'free')
            setSubjects(subjectsRes.data ?? [])
            setInitLoading(false)
        }
        load()
    }, [supabase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const sendMessage = useCallback(async (userText: string, isInitial = false) => {
        const newMessages: Message[] = isInitial
            ? messages
            : [...messages, { role: 'user' as const, content: userText }]

        if (!isInitial) {
            setMessages(newMessages)
            setInput('')
        }
        setLoading(true)

        try {
            const res = await fetch('/api/offer-builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    stage: stage || 1,
                    subjects: subjects.map(s => s.name),
                }),
            })
            const json = await res.json()
            if (!res.ok) {
                setToastError(json.error || 'Something went wrong')
                setTimeout(() => setToastError(null), 4000)
                setLoading(false)
                return
            }
            setMessages(prev => [...prev, { role: 'assistant', content: json.reply }])
            if (json.nextStage) setStage(json.nextStage)
            if (json.blueprint) {
                setBlueprint(json.blueprint)
                setStage(6)
            }
        } catch {
            setToastError('Network error. Please try again.')
            setTimeout(() => setToastError(null), 4000)
        }
        setLoading(false)
    }, [messages, stage, subjects])

    const handleStart = () => {
        setStage(1)
        sendMessage('', true)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (input.trim() && !loading) sendMessage(input.trim())
        }
    }

    const handleCopy = () => {
        if (!blueprint) return
        navigator.clipboard.writeText(blueprint)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSave = async () => {
        if (!blueprint || saving || saved) return
        setSaving(true)
        try {
            const res = await fetch('/api/offer-builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', blueprint }),
            })
            if (res.ok) {
                setSaved(true)
                setToastOk(true)
                setTimeout(() => setToastOk(false), 3000)
            } else {
                const json = await res.json()
                setToastError(json.error || 'Failed to save')
                setTimeout(() => setToastError(null), 4000)
            }
        } catch {
            setToastError('Network error. Please try again.')
            setTimeout(() => setToastError(null), 4000)
        }
        setSaving(false)
    }

    if (initLoading) {
        return (
            <main className="dashboard-main">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                    <Loader2 size={24} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </main>
        )
    }

    // Free plan wall
    if (plan === 'free') {
        return (
            <main className="dashboard-main">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 20 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(16,185,129,0.2))',
                        border: '1px solid rgba(124,58,237,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Lock size={28} color="#a78bfa" />
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Offer Builder is a Pro feature
                        </h2>
                        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6 }}>
                            Upgrade to Pro or Ultra to access the AI-powered interview that helps you discover and structure your high-ticket digital offer from your niche expertise.
                        </p>
                    </div>
                    <a href="/settings" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        Upgrade to Pro <ArrowRight size={16} />
                    </a>
                </div>
            </main>
        )
    }

    return (
        <main className="dashboard-main">
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'linear-gradient(135deg, #10b981, #34d399)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Lightbulb size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Offer Builder
                        </h1>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                            AI-powered interview to discover your high-ticket digital offer
                        </p>
                    </div>
                </div>
            </div>

            {/* Start screen */}
            {stage === 0 && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                    <div className="card" style={{ padding: 32, marginBottom: 24, textAlign: 'center', maxWidth: 560, margin: '0 auto 24px' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 20, marginBottom: 20,
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.1))',
                            border: '1px solid rgba(16,185,129,0.3)',
                            fontSize: 12, fontWeight: 700, color: '#10b981'
                        }}>
                            <Sparkles size={12} /> AI OFFER ARCHITECT
                        </div>
                        <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Discover Your Content Business Blueprint
                        </h2>
                        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            A 6-stage AI interview that analyzes your niche expertise and helps you structure a high-ticket digital offer — course, coaching, community, or digital product.
                        </p>

                        {/* Stage pills */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                            {STAGE_LABELS.map((label, i) => (
                                <div key={i} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: 'var(--bg-secondary)',
                                        border: '1.5px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, color: 'var(--text-muted)'
                                    }}>
                                        {i + 1}
                                    </div>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                                </div>
                            ))}
                        </div>

                        <button className="btn-primary" onClick={handleStart} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            Start the Interview <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Chat interface */}
            {stage > 0 && (
                <div style={{ animation: 'fadeInUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '0 auto' }}>

                    {/* Progress bar */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {STAGE_LABELS.map((label, i) => {
                            const stageNum = i + 1
                            const isComplete = stageNum < stage
                            const isActive = stageNum === stage
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                                    <div style={{
                                        width: '100%', height: 4, borderRadius: 4,
                                        background: isComplete
                                            ? '#10b981'
                                            : isActive
                                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                : 'var(--border)',
                                        transition: 'background 0.3s ease'
                                    }} />
                                    <span style={{
                                        fontSize: 9, fontWeight: 700,
                                        color: isComplete ? '#10b981' : isActive ? '#34d399' : 'var(--text-muted)',
                                        textTransform: 'uppercase', letterSpacing: 0.5,
                                        display: 'none' // hide labels on mobile to save space, shown below
                                    }}>
                                        {label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stage {Math.min(stage, 6)} of 6 — {STAGE_LABELS[Math.min(stage, 6) - 1]}</span>
                        {blueprint && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>Complete ✓</span>}
                    </div>

                    {/* Messages */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 12,
                        minHeight: 300, maxHeight: 480, overflowY: 'auto',
                        padding: '4px 0'
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                animation: 'fadeInUp 0.2s ease'
                            }}>
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.role === 'user'
                                        ? 'rgba(124,58,237,0.15)'
                                        : 'var(--bg-secondary)',
                                    border: msg.role === 'user'
                                        ? '1px solid rgba(124,58,237,0.3)'
                                        : '1px solid var(--border)',
                                    fontSize: 14, lineHeight: 1.65,
                                    color: 'var(--text-secondary)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeInUp 0.2s ease' }}>
                                <div style={{
                                    padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                    <Loader2 size={14} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Thinking…</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area — hidden when blueprint is ready */}
                    {!blueprint && (
                        <div style={{
                            display: 'flex', gap: 10, alignItems: 'flex-end',
                            padding: '12px', borderRadius: 14,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)'
                        }}>
                            <textarea
                                className="input"
                                rows={2}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Your answer… (Enter to send, Shift+Enter for new line)"
                                disabled={loading}
                                style={{
                                    flex: 1, resize: 'none', border: 'none', background: 'transparent',
                                    padding: 0, outline: 'none', fontSize: 14,
                                    color: 'var(--text-primary)', lineHeight: 1.5
                                }}
                            />
                            <button
                                className="btn-primary"
                                onClick={() => { if (input.trim() && !loading) sendMessage(input.trim()) }}
                                disabled={loading || !input.trim()}
                                style={{
                                    padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
                                    opacity: loading || !input.trim() ? 0.5 : 1,
                                    flexShrink: 0
                                }}
                            >
                                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Blueprint card */}
            {blueprint && (
                <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 700, margin: '24px auto 0' }}>
                    <div style={{
                        borderRadius: 16, overflow: 'hidden',
                        border: '1px solid rgba(16,185,129,0.4)',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.1)'
                    }}>
                        {/* Gradient bar */}
                        <div style={{ height: 5, background: 'linear-gradient(135deg, #10b981, #34d399)' }} />

                        <div style={{ padding: '24px' }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 9,
                                        background: 'linear-gradient(135deg, #10b981, #34d399)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Lightbulb size={18} color="white" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Content Business Blueprint</div>
                                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Generated by AI Offer Architect</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={handleCopy}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                            color: '#10b981', fontSize: 12, fontWeight: 700
                                        }}
                                    >
                                        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || saved}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '7px 14px', borderRadius: 8, cursor: saving || saved ? 'not-allowed' : 'pointer',
                                            background: saved ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.1)',
                                            border: saved ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(124,58,237,0.3)',
                                            color: saved ? '#10b981' : '#a78bfa',
                                            fontSize: 12, fontWeight: 700,
                                            opacity: saving ? 0.6 : 1
                                        }}
                                    >
                                        {saving ? (
                                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                        ) : saved ? (
                                            <><Check size={13} /> Saved!</>
                                        ) : (
                                            <><BookmarkPlus size={13} /> Save to Digests</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Blueprint content */}
                            <BlueprintContent content={blueprint} />
                        </div>
                    </div>
                </div>
            )}

            {/* Toast error */}
            {toastError && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                    backdropFilter: 'blur(8px)', borderRadius: 12, padding: '12px 20px',
                    color: '#ef4444', fontSize: 14, fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}>
                    {toastError}
                </div>
            )}

            {/* Toast success */}
            {toastOk && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                    backdropFilter: 'blur(8px)', borderRadius: 12, padding: '12px 20px',
                    color: '#10b981', fontSize: 14, fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    <Check size={16} /> Blueprint saved to Digests
                </div>
            )}
        </main>
    )
}
