'use client'

import { Youtube, MessageSquare, Rss, Sparkles, ExternalLink } from 'lucide-react'
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
}

function SourceIcon({ type }: { type: string }) {
    if (type === 'youtube') return <Youtube size={13} />
    if (type === 'reddit') return <MessageSquare size={13} />
    return <Rss size={13} />
}

function sourceColor(type: string) {
    if (type === 'youtube') return { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' }
    if (type === 'reddit') return { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' }
    return { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' }
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

/** Thumbnail grid for Reddit posts */
function ThumbnailGrid({ thumbnails }: { thumbnails: Thumbnail[] }) {
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set())
    const visible = thumbnails.filter(t => !failedUrls.has(t.thumb)).slice(0, 4)
    if (visible.length === 0) return null

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(visible.length, 2)}, 1fr)`,
            gap: 8,
            marginTop: 4,
        }}>
            {visible.map((t, i) => (
                <a
                    key={i}
                    href={t.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ position: 'relative', display: 'block', borderRadius: 10, overflow: 'hidden', textDecoration: 'none' }}
                >
                    <img
                        src={t.thumb}
                        alt={t.title}
                        onError={() => setFailedUrls(prev => new Set(prev).add(t.thumb))}
                        style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            display: 'block',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                        }}
                    />
                    {/* Overlay */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 10,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        padding: '8px 10px', gap: 2,
                    }}>
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                            {t.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>▲ {t.score}</span>
                            <ExternalLink size={9} color="rgba(255,255,255,0.6)" />
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
    const aiGenerated = isAIGenerated(digest.content)
    const thumbnails = digest.metadata?.thumbnails ?? []

    const accentGradient = isReddit
        ? 'linear-gradient(135deg, #f97316, #fb923c)'
        : digest.source_type === 'youtube'
            ? 'linear-gradient(135deg, #ef4444, #f87171)'
            : 'linear-gradient(135deg, #7c3aed, #e879f9)'

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
        }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: col.bg, color: col.color, border: `1px solid ${col.border}`
                    }}>
                        <SourceIcon type={digest.source_type} />
                        {digest.source_type.charAt(0).toUpperCase() + digest.source_type.slice(1)}
                    </span>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                        background: aiGenerated ? 'rgba(124,58,237,0.12)' : 'rgba(100,100,100,0.12)',
                        color: aiGenerated ? '#a78bfa' : 'var(--text-muted)',
                        border: aiGenerated ? '1px solid rgba(124,58,237,0.25)' : '1px solid var(--border)'
                    }}>
                        <Sparkles size={10} />
                        {aiGenerated ? 'AI digest' : 'Quick digest'}
                    </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatRelative(digest.created_at)}
                </span>
            </div>

            {/* Source name */}
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {digest.source_name}
            </h3>

            {/* Thumbnails (Reddit only, above content) */}
            {isReddit && thumbnails.length > 0 && (
                <ThumbnailGrid thumbnails={thumbnails} />
            )}

            {/* Content */}
            {isReddit && aiGenerated
                ? <RedditDigestContent content={digest.content} />
                : <GenericDigestContent content={digest.content} accentColor={accentGradient} />
            }
        </div>
    )
}
