'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users } from 'lucide-react'

interface Props {
  subjectId: string
  refreshKey?: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
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

const platformColor: Record<string, string> = {
  youtube: '#ff4444',
  twitch: '#9146ff',
  reddit: '#ff6314',
}

export default function ChannelList({ subjectId, refreshKey }: Props) {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('channels')
      .select('id, name, platform, subscribers, avg_views_per_video, growth_rate_30d, avatar_url, last_synced_at')
      .eq('subject_id', subjectId)
      .order('subscribers', { ascending: false })
      .then(({ data }) => {
        setChannels(data ?? [])
        setLoading(false)
      })
  }, [subjectId, refreshKey])

  if (loading) return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      Loading channels...
    </div>
  )

  if (channels.length === 0) {
    return (
      <div style={{
        padding: '32px 20px', textAlign: 'center',
        background: 'var(--bg-card)', border: '1px dashed var(--border)',
        borderRadius: 14
      }}>
        <Users size={28} color="var(--text-muted)" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
          No channels added yet
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Search and add YouTube channels above to start tracking
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
      {channels.map(ch => {
        const color = platformColor[ch.platform] ?? '#7c3aed'
        const growth = ch.growth_rate_30d ?? 0
        return (
          <div key={ch.id} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: ch.avatar_url ? `url(${ch.avatar_url}) center/cover` : `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, fontSize: 18, fontWeight: 800,
              }}>
                {!ch.avatar_url && ch.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{ch.name}</span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {fmt(ch.subscribers ?? 0)} subs
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(ch.avg_views_per_video ?? 0)}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>avg views</div>
              </div>
              <div style={{
                padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                background: growth > 0 ? 'rgba(16,185,129,0.08)' : growth < 0 ? 'rgba(239,68,68,0.08)' : 'var(--bg-secondary)',
              }}>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  color: growth > 0 ? '#10b981' : growth < 0 ? '#ef4444' : 'var(--text-primary)'
                }}>
                  {growth > 0 ? '+' : ''}{growth}%
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>30d growth</div>
              </div>
            </div>

            {ch.last_synced_at && (
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 10 }}>
                synced {timeAgo(ch.last_synced_at)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
