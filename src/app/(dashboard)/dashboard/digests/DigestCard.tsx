'use client'

import { Youtube, MessageSquare, Rss, Sparkles, ExternalLink, Clock, Twitter, ChevronDown, Zap } from 'lucide-react'
import { useState } from 'react'

interface Thumbnail {
    title: string
    thumb: string
    permalink: string
    score: number
}

interface Digest {
    id: string
    source_name: string
    source_type: string
    content: string
    created_at: string
    metadata?: { thumbnails?: Thumbnail[] } | null
    source_url?: string
}

function SourceIcon({ type }: { type: string }) {
    if (type === 'youtube') return <Youtube size={16} />
    if (type === 'reddit') return <MessageSquare size={16} />
    if (type === 'twitter') return <Twitter size={16} />
    if (type === 'bluesky') return <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px' }}>Bs</span>
    if (type === 'hackernews') return <span style={{ fontWeight: 800, fontSize: 13, background: '#ff6600', color: '#fff', padding: '0 2px' }}>Y</span>
    return <Rss size={16} />
}

function sourceColor(type: string) {
    if (type === 'youtube') return { bg: 'rgba(239,68,68,0.2)', color: '#ff6b6b', border: 'rgba(255,107,107,0.4)', gradient: 'linear-gradient(135deg, #ff4757, #ff6b6b)' }
    if (type === 'twitter') return { bg: 'rgba(29,155,240,0.2)', color: '#1da9f0', border: 'rgba(29,155,240,0.4)', gradient: 'linear-gradient(135deg, #1da9f0, #55acee)' }
    if (type === 'bluesky') return { bg: 'rgba(26,144,255,0.2)', color: '#1690ff', border: 'rgba(26,144,255,0.4)', gradient: 'linear-gradient(135deg, #1690ff, #5ba3ff)' }
    if (type === 'hackernews') return { bg: 'rgba(255,102,0,0.2)', color: '#ff6600', border: 'rgba(255,102,0,0.4)', gradient: 'linear-gradient(135deg, #ff6600, #ff8533)' }
    if (type === 'reddit') return { bg: 'rgba(255,145,0,0.2)', color: '#ff9100', border: 'rgba(255,145,0,0.4)', gradient: 'linear-gradient(135deg, #ff7e22, #ff9100)' }
    if (type === 'subject') return { bg: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: 'rgba(124,58,237,0.4)', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }
    return { bg: 'rgba(102,117,255,0.2)', color: '#6675ff', border: 'rgba(102,117,255,0.4)', gradient: 'linear-gradient(135deg, #6675ff, #7c97ff)' }
}

function formatRelative(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

function isRichFormat(content: string): boolean {
    const hasHeader = content.includes('**🔥') || content.includes('**📈') || content.includes('**🚨') ||
        content.includes('**🎯') || content.includes('**📢') || content.includes('**🎬') || content.includes('**🏆')
    const hasTakeaway = content.includes('**💡 Takeaway') || content.includes('💡 Takeaway')
    return hasHeader && hasTakeaway
}

function isAIGenerated(content: string): boolean {
    return isRichFormat(content) ||
        content.includes('**📌') || content.includes('**💡') ||
        (content.includes('•') && !content.startsWith('•'))
}

/** Parse **bold** and [text](url) inline markdown into React nodes */
function parseInline(text: string, linkColor: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    const regex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
    let last = 0, m, k = 0
    while ((m = regex.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index))
        if (m[1] !== undefined) {
            parts.push(
                <strong key={k++} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{m[1]}</strong>
            )
        } else if (m[2] && m[3]) {
            parts.push(
                <a key={k++} href={m[3]} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                        color: linkColor, textDecoration: 'none',
                        borderBottom: `1px solid ${linkColor}60`,
                        fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3
                    }}
                >
                    {m[2]}<ExternalLink size={10} />
                </a>
            )
        }
        last = regex.lastIndex
    }
    if (last < text.length) parts.push(text.slice(last))
    return <>{parts}</>
}

/** Unified digest content renderer — handles plain bullets, rich Pro format, and legacy sections */
function DigestContent({ content, accentColor }: { content: string; accentColor: string }) {
    const linkColor = '#a78bfa'
    const lines = content.split('\n').filter(l => l.trim())

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lines.map((line, i) => {
                const t = line.trim()

                // Takeaway block
                if (t.startsWith('**💡 Takeaway') || t.startsWith('💡 Takeaway')) {
                    const text = t
                        .replace(/^\*\*💡 Takeaway\*\*:?\s*/, '')
                        .replace(/^💡 Takeaway:?\s*/, '')
                    return (
                        <div key={i} style={{
                            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
                            borderRadius: 10, padding: '10px 14px', marginTop: 6,
                            fontSize: 13, lineHeight: 1.65
                        }}>
                            <span style={{ fontWeight: 700, color: linkColor }}>💡 Takeaway: </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{parseInline(text, linkColor)}</span>
                        </div>
                    )
                }

                // Section header: **emoji text:** or **emoji text**
                if (/^\*\*[^*]/.test(t) && /\*\*:?$/.test(t)) {
                    const header = t.replace(/^\*\*/, '').replace(/\*\*:?$/, '').replace(/:$/, '').trim()
                    return (
                        <div key={i} style={{
                            fontSize: 12, fontWeight: 800, color: 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            borderBottom: '1px solid var(--border)', paddingBottom: 6,
                            marginTop: i > 0 ? 6 : 0
                        }}>
                            {header}
                        </div>
                    )
                }

                // Bullet point
                if (t.startsWith('•') || t.startsWith('-')) {
                    const text = t.replace(/^[•\-]\s*/, '')
                    return (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 5, height: 5, borderRadius: '50%', marginTop: 9, flexShrink: 0,
                                background: accentColor
                            }} />
                            <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                                {parseInline(text, linkColor)}
                            </span>
                        </div>
                    )
                }

                // Plain text / paragraph
                return (
                    <p key={i} style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {parseInline(t, linkColor)}
                    </p>
                )
            })}
        </div>
    )
}

/** Thumbnail grid — shown for paid plans */
function ThumbnailGrid({ thumbnails, sourceType }: { thumbnails: Thumbnail[]; sourceType: string }) {
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set())
    const visible = thumbnails.filter(t => !failedUrls.has(t.thumb)).slice(0, 3)
    if (visible.length === 0) return null

    const isCompact = sourceType === 'reddit'
    const cols = isCompact ? Math.min(visible.length, 2) : 1

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: isCompact ? 8 : 12, marginTop: 12, marginBottom: 12,
        }}>
            {visible.map((t, i) => (
                <a key={i} href={t.permalink} target="_blank" rel="noopener noreferrer"
                    style={{
                        position: 'relative', display: 'block', borderRadius: 12,
                        overflow: 'hidden', textDecoration: 'none',
                        aspectRatio: sourceType === 'reddit' ? '4/3' : '16/9',
                        transition: 'all 0.3s ease', cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px var(--border)'
                    }}
                >
                    <img src={t.thumb} alt={t.title}
                        onError={() => setFailedUrls(prev => new Set(prev).add(t.thumb))}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: '1px solid var(--border)', borderRadius: 12 }}
                    />
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 12,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 70%)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        padding: '12px', gap: 8,
                    }}>
                        <span style={{
                            fontSize: 12, color: '#fff', fontWeight: 600, lineHeight: 1.4,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitBoxOrient: 'vertical', WebkitLineClamp: 2
                        }}>
                            {t.title || 'Item'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {sourceType === 'reddit' && (
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>▲ {t.score?.toLocaleString() || '0'}</span>
                            )}
                            <ExternalLink size={12} color="rgba(255,255,255,0.9)" style={{ marginLeft: 'auto' }} />
                        </div>
                    </div>
                </a>
            ))}
        </div>
    )
}

export default function DigestCard({ digest }: { digest: Digest }) {
    const col = sourceColor(digest.source_type)
    const thumbnails = digest.metadata?.thumbnails ?? []
    const [isExpanded, setIsExpanded] = useState(false)

    const rich = isRichFormat(digest.content)
    const aiGen = isAIGenerated(digest.content)

    // Preview: prefer the first real bullet, stripped of markdown
    const contentPreview = (() => {
        const lines = digest.content.split('\n')
        const bullet = lines.find(l => l.trim().startsWith('•') || l.trim().startsWith('-'))
        if (bullet) return bullet.replace(/^[•\-]\s*/, '').replace(/\*\*/g, '').slice(0, 130)
        return lines.find(l => l.trim() && !l.trim().startsWith('**'))?.replace(/\*\*/g, '').slice(0, 130) ?? ''
    })()

    const badge = rich ? (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(250,204,21,0.15))',
            color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)', whiteSpace: 'nowrap'
        }}>
            <Zap size={10} /> PRO
        </div>
    ) : aiGen ? (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
            background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
            border: '1px solid rgba(124,58,237,0.3)', whiteSpace: 'nowrap'
        }}>
            <Sparkles size={11} /> AI
        </div>
    ) : null

    const cardHeader = (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: col.bg, border: `1.5px solid ${col.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: col.color, flexShrink: 0
                }}>
                    <SourceIcon type={digest.source_type} />
                </div>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {digest.source_type}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Clock size={11} />
                        {formatRelative(digest.created_at)}
                    </div>
                </div>
            </div>
            {badge}
        </div>
    )

    return (
        <>
            {/* Card (collapsed) */}
            <div
                onClick={() => setIsExpanded(true)}
                style={{
                    background: rich
                        ? 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(124,58,237,0.06) 100%)'
                        : 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(124,58,237,0.03) 100%)',
                    border: `1px solid ${rich ? 'rgba(124,58,237,0.35)' : col.border}`,
                    borderRadius: 16, padding: 0,
                    display: 'flex', flexDirection: 'column', gap: 0,
                    overflow: 'hidden', transition: 'all 0.3s ease',
                    cursor: 'pointer', height: '100%', position: 'relative'
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = col.color
                    ;(e.currentTarget as HTMLElement).style.boxShadow = `0 16px 32px rgba(0,0,0,0.12)`
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = rich ? 'rgba(124,58,237,0.35)' : col.border
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
            >
                <div style={{ height: 4, background: col.gradient, width: '100%' }} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    {cardHeader}
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                        {digest.source_name}
                    </h3>
                    {thumbnails.length > 0 && <ThumbnailGrid thumbnails={thumbnails} sourceType={digest.source_type} />}
                    <div style={{
                        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                        display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
                        overflow: 'hidden', flex: 1
                    }}>
                        {contentPreview}…
                    </div>
                </div>
                <div style={{
                    padding: '12px 20px', borderTop: `1px solid ${col.border}`,
                    background: rich ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.02)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, color: col.color, fontWeight: 600, justifyContent: 'space-between'
                }}>
                    <span>View full digest</span>
                    <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </div>
            </div>

            {/* Modal overlay */}
            {isExpanded && (
                <div
                    onClick={() => setIsExpanded(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px', animation: 'digestOverlayIn 0.2s ease'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: `1px solid ${rich ? 'rgba(124,58,237,0.45)' : col.border}`,
                            borderRadius: 20, padding: 0,
                            width: '100%', maxWidth: 640,
                            maxHeight: '88vh', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: rich
                                ? `0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.15), 0 0 0 1px rgba(124,58,237,0.3)`
                                : `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px ${col.border}`,
                            animation: 'digestCardIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    >
                        <div style={{ height: 4, background: col.gradient, width: '100%', flexShrink: 0 }} />
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                            {cardHeader}
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {digest.source_name}
                            </h3>
                            {thumbnails.length > 0 && <ThumbnailGrid thumbnails={thumbnails} sourceType={digest.source_type} />}
                            <div>
                                <DigestContent content={digest.content} accentColor={col.gradient} />
                            </div>
                        </div>
                        <div
                            onClick={() => setIsExpanded(false)}
                            style={{
                                padding: '14px 24px', borderTop: `1px solid ${col.border}`,
                                background: 'rgba(124,58,237,0.03)', display: 'flex',
                                alignItems: 'center', gap: 8, fontSize: 13, color: col.color,
                                fontWeight: 600, justifyContent: 'space-between',
                                cursor: 'pointer', flexShrink: 0
                            }}
                        >
                            <span>Close</span>
                            <ChevronDown size={14} style={{ opacity: 0.6, transform: 'rotate(180deg)' }} />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes digestOverlayIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes digestCardIn {
                    from { opacity: 0; transform: scale(0.92) translateY(16px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    )
}
