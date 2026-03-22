'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Youtube, MessageSquare, Rss, Sparkles, ArrowRight, CheckCircle, Zap, TrendingUp } from 'lucide-react'

const STEPS = [
    {
        step: 1,
        emoji: '👋',
        title: 'Welcome to Stalk.ai',
        subtitle: 'Your AI trend analyst for content creators',
        content: "Stalk.ai monitors your niche sources 24/7 and tells you what's trending before anyone else does. Here's how to get set up in 3 minutes.",
        visual: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                    { icon: <TrendingUp size={16} />, color: '#7c3aed', text: 'Detect trends early' },
                    { icon: <Sparkles size={16} />, color: '#f59e0b', text: 'AI-powered analysis' },
                    { icon: <Zap size={16} />, color: '#10b981', text: 'Daily digest by email' },
                ].map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 12,
                        background: `${item.color}12`, border: `1px solid ${item.color}30`,
                    }}>
                        <div style={{ color: item.color, flexShrink: 0 }}>{item.icon}</div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.text}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        step: 2,
        emoji: '📁',
        title: 'Create a Subject',
        subtitle: 'Step 1 of 3',
        content: 'A Subject is the niche topic you want to track — for example "Minecraft speedruns", "Horror gaming" or "AI Tools for creators". It groups all your sources together.',
        visual: (
            <div style={{
                padding: '16px 20px', borderRadius: 14,
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
            }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                    Example subjects
                </div>
                {['Minecraft speedruns', 'Horror gaming', 'AI Tools for creators', 'Fitness & Nutrition'].map((s, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 0',
                        borderBottom: i < 3 ? '1px solid rgba(124,58,237,0.12)' : 'none',
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        step: 3,
        emoji: '🔗',
        title: 'Add Sources',
        subtitle: 'Step 2 of 3',
        content: "Inside each subject, add the sources you want to monitor. YouTube channels, subreddits, Twitch streamers, RSS feeds… Stalk.ai supports them all.",
        visual: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                    { icon: <Youtube size={15} />, color: '#ff4444', label: 'YouTube', example: 'youtube.com/@channel', free: true },
                    { icon: <MessageSquare size={15} />, color: '#ff6314', label: 'Reddit', example: 'reddit.com/r/subreddit', free: false },
                    { icon: <Rss size={15} />, color: '#10b981', label: 'RSS / Blog', example: 'example.com/feed.xml', free: true },
                    { icon: <span style={{ fontSize: 12, fontWeight: 800 }}>Bs</span>, color: '#1690ff', label: 'Bluesky', example: '@user.bsky.social', free: true },
                ].map((src, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 10,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    }}>
                        <div style={{ color: src.color, width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{src.icon}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{src.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{src.example}</div>
                        </div>
                        {!src.free && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', whiteSpace: 'nowrap' }}>PRO</span>
                        )}
                    </div>
                ))}
            </div>
        ),
    },
    {
        step: 4,
        emoji: '✨',
        title: 'Generate your Digest',
        subtitle: 'Step 3 of 3',
        content: 'Hit "Generate digest" and our AI reads all your sources at once, detects patterns, and tells you exactly what\'s trending in your niche right now.',
        visual: (
            <div style={{
                padding: '16px 20px', borderRadius: 14,
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={13} color="#a78bfa" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8 }}>AI Digest — Minecraft speedruns</span>
                </div>
                {[
                    { emoji: '🔥', text: 'Survival hardcore is dominating this week — 3 channels posted series simultaneously' },
                    { emoji: '📈', text: 'Reaction format is up 40% vs. last month across tracked channels' },
                    { emoji: '💡', text: 'Takeaway: post a hardcore series before the trend peaks — demand is still rising' },
                ].map((line, i) => (
                    <div key={i} style={{
                        fontSize: 12, color: i === 2 ? '#a78bfa' : 'var(--text-secondary)',
                        lineHeight: 1.6, paddingBottom: i < 2 ? 8 : 0,
                        borderBottom: i < 2 ? '1px solid rgba(124,58,237,0.12)' : 'none',
                        marginBottom: i < 2 ? 8 : 0,
                    }}>
                        {line.emoji} {line.text}
                    </div>
                ))}
            </div>
        ),
    },
]

const STORAGE_KEY = 'stalkai_onboarding_done'

export default function OnboardingModal({ isNewUser }: { isNewUser: boolean }) {
    const [visible, setVisible] = useState(false)
    const [step, setStep] = useState(0)
    const router = useRouter()

    useEffect(() => {
        if (!isNewUser) return
        const done = localStorage.getItem(STORAGE_KEY)
        if (!done) setVisible(true)
    }, [isNewUser])

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1')
        setVisible(false)
    }

    const finish = () => {
        localStorage.setItem(STORAGE_KEY, '1')
        setVisible(false)
        router.push('/dashboard/subjects')
    }

    if (!visible) return null

    const current = STEPS[step]
    const isLast = step === STEPS.length - 1

    return (
        <div
            onClick={dismiss}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px',
                animation: 'onboardingOverlayIn 0.25s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(124,58,237,0.35)',
                    borderRadius: 24, padding: 0,
                    width: '100%', maxWidth: 500,
                    overflow: 'hidden',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.1)',
                    animation: 'onboardingCardIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                {/* Gradient top bar */}
                <div style={{ height: 5, background: 'linear-gradient(90deg, #7c3aed, #e879f9, #f59e0b)' }} />

                {/* Progress dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '20px 0 0' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                            background: i <= step ? 'var(--accent-bright)' : 'var(--border)',
                            transition: 'all 0.3s ease',
                        }} />
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '24px 32px 32px' }}>
                    {/* Dismiss */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <button onClick={dismiss} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                            display: 'flex', alignItems: 'center',
                        }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Emoji + title */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>{current.emoji}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                            {current.subtitle}
                        </div>
                        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {current.title}
                        </h2>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {current.content}
                        </p>
                    </div>

                    {/* Visual */}
                    <div style={{ marginBottom: 28 }}>
                        {current.visual}
                    </div>

                    {/* Navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <button
                            onClick={() => setStep(s => Math.max(0, s - 1))}
                            disabled={step === 0}
                            style={{
                                background: 'none', border: '1px solid var(--border)',
                                borderRadius: 8, padding: '9px 18px',
                                color: step === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                                fontSize: 13, fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer',
                                opacity: step === 0 ? 0.4 : 1,
                            }}
                        >
                            Back
                        </button>

                        {isLast ? (
                            <button
                                onClick={finish}
                                className="btn-primary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                <CheckCircle size={15} /> Create my first subject
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                className="btn-primary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                Next <ArrowRight size={15} />
                            </button>
                        )}
                    </div>

                    {/* Skip */}
                    {!isLast && (
                        <div style={{ textAlign: 'center', marginTop: 14 }}>
                            <button onClick={dismiss} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', fontSize: 12, textDecoration: 'underline',
                            }}>
                                Skip tutorial
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes onboardingOverlayIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes onboardingCardIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    )
}
