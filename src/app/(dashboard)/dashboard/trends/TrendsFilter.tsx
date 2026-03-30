'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface Trend {
  id: string
  topic: string
  source_platform: string
  status: string
  detail: string
  strength_score: number
  first_detected_at: string
  subject_id: string
  subjects: { name: string } | null
}

interface Props {
  trends: Trend[]
}

const platformColor: Record<string, string> = {
  youtube: '#ff4444',
  reddit: '#ff6314',
  twitch: '#9146ff',
}

const statusStyle: Record<string, { bg: string; text: string }> = {
  emerging:  { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
  peak:      { bg: 'rgba(255,92,92,0.12)',   text: '#ff7c7c' },
  declining: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
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

type Filter = 'all' | 'emerging' | 'peak' | 'declining'

export default function TrendsFilter({ trends }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all' ? trends : trends.filter(t => t.status === filter)

  // Group by subject
  const groups: { subjectId: string; subjectName: string; trends: Trend[] }[] = []
  const seen = new Map<string, number>()
  for (const t of filtered) {
    const key = t.subject_id
    if (!seen.has(key)) {
      seen.set(key, groups.length)
      groups.push({ subjectId: key, subjectName: t.subjects?.name ?? 'Unknown', trends: [] })
    }
    groups[seen.get(key)!].trends.push(t)
  }

  const filters: { key: Filter; label: string; color: string }[] = [
    { key: 'all',       label: 'All',       color: '#9d5cf6' },
    { key: 'emerging',  label: 'Emerging',  color: '#10b981' },
    { key: 'peak',      label: 'Peak',      color: '#ff7c7c' },
    { key: 'declining', label: 'Declining', color: '#f59e0b' },
  ]

  if (trends.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 40px',
        background: 'var(--bg-card)', border: '1px dashed var(--border)',
        borderRadius: 16
      }}>
        <TrendingUp size={32} color="var(--text-muted)" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>No trends detected yet</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
          Add YouTube channels to your subjects and sync them — Stalk-AI will start detecting trends automatically.
        </p>
        <Link href="/dashboard/subjects" className="btn-primary" style={{ fontSize: 14 }}>
          Go to Subjects
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="trends-filter-pills" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {filters.map(f => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: active ? `${f.color}18` : 'transparent',
                border: `1px solid ${active ? f.color : 'var(--border)'}`,
                color: active ? f.color : 'var(--text-muted)',
              }}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  {trends.filter(t => t.status === f.key).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Trend cards grouped by subject */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          No {filter} trends right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {groups.map(group => (
            <div key={group.subjectId}>
              {/* Subject header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                paddingBottom: 10, borderBottom: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(232,121,249,0.1))',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: 'var(--accent-bright)'
                }}>
                  {group.subjectName.charAt(0).toUpperCase()}
                </div>
                <Link href={`/dashboard/subjects/${group.subjectId}`} style={{
                  fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none'
                }}>
                  {group.subjectName}
                </Link>
                <span className="mono" style={{
                  fontSize: 11, color: 'var(--text-muted)', marginLeft: 2
                }}>
                  {group.trends.length} trend{group.trends.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Cards for this subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {group.trends.map(trend => {
                  const sc = statusStyle[trend.status] ?? statusStyle.emerging
                  const strength = (trend.strength_score * 10).toFixed(1)
                  const pct = Math.round(trend.strength_score * 100)

                  return (
                    <div key={trend.id} className="card" style={{
                      padding: '18px 22px', cursor: 'default',
                      transition: 'transform 0.15s, background 0.15s',
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.background = 'var(--bg-card-hover)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = ''
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: platformColor[trend.source_platform] ?? '#7c3aed'
                          }} />
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{trend.topic}</span>
                        </div>
                        <span className="mono" style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                          background: sc.bg, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {trend.status}
                        </span>
                      </div>

                      {/* Detail */}
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                        {trend.detail}
                      </div>

                      {/* Strength bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          flex: 1, height: 4, borderRadius: 4,
                          background: 'var(--border)', overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${pct}%`, height: '100%', borderRadius: 4,
                            background: sc.text, transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: sc.text, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {strength}/10
                        </span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {timeAgo(trend.first_detected_at)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
