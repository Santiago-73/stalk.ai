'use client'

import { Youtube, MessageSquare, Rss, Sparkles, ExternalLink, ArrowUpRight, Clock, Twitter, FileText, TrendingUp, ChevronDown } from 'lucide-react'
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

/** Detect if content is AI-generated Reddit format (has headers with emojis) */
function isAIGenerated(content: string) {
    return content.includes('**🔥') || content.includes('**📌') || content.includes('**💡') ||
        (content.includes('•') && !content.startsWith('•'))
}

/** Reddit AI digest renderer — parses bold section headers + bullets */
function RedditDigestContent({ content }: { content: string }) {
    const lines = content.split('\n')
    const sections: { header: string | null; items: string[] }[] = []
    let current: { header: string | null; items: string[] } = { header: null, items: [] }

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // Bold section header: **emoji text:**
        if (/^\*\*[^*].+\*\*/.test(trimmed)) {
            if (current.items.length > 0 || current.header !== null) {
                sections.push(current)
            }
            current = { header: trimmed.replace(/\*\*/g, '').trim(), items: [] }
        } else if (trimmed.startsWith('•')) {
            current.items.push(trimmed.replace(/^•\s*/, ''))
        } else {
            // Paragraph text (highlight text, conclusion, etc.)
            current.items.push(trimmed)
        }
    }
    if (current.items.length > 0 || current.header !== null) sections.push(current)

    if (sections.length === 0) {
        return <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{content}</p>
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sections.map((section, i) => (
                <div key={i}>
                    {section.header && (
                        <p style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            letterSpacing: '0.01em',
                        }}>
                            {section.header}
                        </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {section.items.map((item, j) => {
                            const dashIdx = item.indexOf(' — ')
                            if (dashIdx !== -1 && section.header?.includes('📌')) {
                                const title = item.slice(0, dashIdx)
                                const explanation = item.slice(dashIdx + 3)
                                return (
                                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: '50%', marginTop: 7, flexShrink: 0,
                                            background: 'linear-gradient(135deg, #f97316, #fb923c)'
                                        }} />
                                        <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                                            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{title}</strong>
                                            {' — '}{explanation}
                                        </span>
                                    </div>
                                )
                            }
                            // Is it a bullet or a plain text (conclusion, highlight)?
                            const isBullet = section.header?.includes('📌')
                            return (
                                <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    {isBullet && (
                                        <span style={{
                                            width: 6, height: 6, borderRadius: '50%', marginTop: 7, flexShrink: 0,
                                            background: 'linear-gradient(135deg, #f97316, #fb923c)'
                                        }} />
                                    )}
                                    <span style={{
                                        fontSize: 14,
                                        color: section.header?.includes('🔥') || section.header?.includes('💡')
                                            ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        lineHeight: 1.65,
                                        fontStyle: section.header?.includes('💡') ? 'italic' : 'normal',
                                    }}>{item}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

/** Fallback for non-AI content — bullet list */
function GenericDigestContent({ content, accentColor }: { content: string; accentColor: string }) {
    const bullets = content
        .split('\n')
        .filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'))
        .map(l => l.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)

    if (bullets.length > 0) {
        return (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bullets.map((b, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%', marginTop: 7, flexShrink: 0,
                            background: accentColor
                        }} />
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{b}</span>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {content}
        </p>
    )
}

/** Enhanced Thumbnail grid for all source types */
function ThumbnailGrid({ thumbnails, sourceType }: { thumbnails: Thumbnail[]; sourceType: string }) {
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set())
    const visible = thumbnails.filter(t => !failedUrls.has(t.thumb)).slice(0, 3)
    if (visible.length === 0) return null

    const isCompact = sourceType === 'reddit'
    const cols = isCompact ? Math.min(visible.length, 2) : 1

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: isCompact ? 8 : 12,
            marginTop: 12,
            marginBottom: 12,
        }}>
            {visible.map((t, i) => (
                <a
                    key={i}
                    href={t.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        position: 'relative',
                        display: 'block',
                        borderRadius: 12,
                        overflow: 'hidden',
                        textDecoration: 'none',
                        aspectRatio: sourceType === 'reddit' ? '4/3' : '16/9',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                            ; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                            ; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px var(--border)'
                    }}
                >
                    <img
                        src={t.thumb}
                        alt={t.title}
                        onError={() => setFailedUrls(prev => new Set(prev).add(t.thumb))}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                        }}
                    />
                    {/* Overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 12,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 70%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '12px',
                        gap: 8,
                    }}>
                        <span style={{
                            fontSize: 12,
                            color: '#fff',
                            fontWeight: 600,
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2
                        }}>
                            {t.title || 'Item'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {sourceType === 'reddit' && (
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                                    ▲ {t.score?.toLocaleString() || '0'}
                                </span>
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
    const isReddit = digest.source_type === 'reddit'
    const isYoutube = digest.source_type === 'youtube'
    const aiGenerated = isAIGenerated(digest.content)
    const thumbnails = digest.metadata?.thumbnails ?? []
    const [isExpanded, setIsExpanded] = useState(false)

    const contentPreview = digest.content
        .split('\n')
        .filter(l => l.trim() && !l.includes('**'))
        .slice(0, 2)
        .join(' ')
        .substring(0, 120)

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(124,58,237,0.03) 100%)',
                border: `1px solid ${col.border}`,
                borderRadius: 16,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                height: isExpanded ? 'auto' : '100%',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = col.color
                    ; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 32px rgba(0,0,0,0.1), inset 0 1px 0 ${col.border}`
                    ; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = col.border
                    ; (e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    ; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
        >
            {/* Top accent bar */}
            <div style={{
                height: 4,
                background: col.gradient,
                width: '100%'
            }} />

            {/* Main content */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: col.bg,
                            border: `1.5px solid ${col.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: col.color,
                            flexShrink: 0
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
                    {aiGenerated && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'rgba(124,58,237,0.15)',
                            color: '#a78bfa',
                            border: '1px solid rgba(124,58,237,0.3)',
                            whiteSpace: 'nowrap'
                        }}>
                            <Sparkles size={11} />
                            AI
                        </div>
                    )}
                </div>

                {/* Source name */}
                <h3 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    wordBreak: 'break-word'
                }}>
                    {digest.source_name}
                </h3>

                {/* Thumbnails if exist */}
                {thumbnails.length > 0 && (
                    <ThumbnailGrid thumbnails={thumbnails} sourceType={digest.source_type} />
                )}

                {/* Content preview */}
                {!isExpanded && (
                    <div style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                        overflow: 'hidden',
                        flex: 1
                    }}>
                        {contentPreview}...
                    </div>
                )}

                {/* Full content */}
                {isExpanded && (
                    <div style={{ marginTop: 8 }}>
                        {(isReddit && aiGenerated) ? (
                            <div style={{ maxHeight: 200, overflow: 'auto' }}>
                                <RedditDigestContent content={digest.content} />
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                <GenericDigestContent content={digest.content} accentColor={col.gradient} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer action */}
            <div style={{
                padding: '12px 20px',
                borderTop: `1px solid ${col.border}`,
                background: 'rgba(124,58,237,0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: col.color,
                fontWeight: 600,
                justifyContent: 'space-between'
            }}>
                <span>{isExpanded ? 'Collapse digest' : 'View full digest'}</span>
                <ChevronDown size={14} style={{ opacity: 0.6, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
            </div>
        </div>
    )
}
