'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Plus, Check } from 'lucide-react'

interface SearchResult {
  id: string
  platform_channel_id: string
  name: string
  avatar_url: string | null
  followers: number
  is_live: boolean
  game: string | null
}

interface Props {
  subjectId: string
  onChannelAdded?: () => void
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export default function TwitchChannelSearch({ subjectId, onChannelAdded }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    setResults([])
    try {
      const res = await fetch(`/api/twitch/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      setResults(data.results ?? [])
    } catch (e: any) {
      setSearchError(e.message)
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(channel: SearchResult) {
    setAddingId(channel.id)
    try {
      const res = await fetch('/api/twitch/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channel.platform_channel_id, subject_id: subjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      setAddedIds(prev => new Set([...prev, channel.id]))
      onChannelAdded?.()
      router.refresh()
    } catch (e: any) {
      setSearchError(e.message)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          className="input"
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) setResults([]) }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search Twitch channels..."
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{ padding: '0 20px', opacity: searching || !query.trim() ? 0.7 : 1 }}
        >
          {searching
            ? <><Loader2 size={15} className="spin" /> Searching...</>
            : <><Search size={15} /> Search</>
          }
        </button>
      </div>

      {searchError && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 12,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', fontSize: 13
        }}>
          {searchError}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map(ch => {
            const isAdding = addingId === ch.id
            const isAdded = addedIds.has(ch.id)
            return (
              <div key={ch.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: ch.avatar_url ? `url(${ch.avatar_url}) center/cover` : 'rgba(145,70,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9146ff', fontWeight: 800, fontSize: 16,
                }}>
                  {!ch.avatar_url && ch.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{ch.name}</span>
                    {ch.is_live && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(239,68,68,0.15)', color: '#f87171',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatNum(ch.followers)} followers
                    {ch.game && ` · ${ch.game}`}
                  </div>
                </div>
                <button
                  className={isAdded ? 'btn-secondary' : 'btn-primary'}
                  onClick={() => !isAdded && handleAdd(ch)}
                  disabled={isAdding || isAdded}
                  style={{
                    padding: '7px 16px', fontSize: 13, flexShrink: 0,
                    opacity: isAdded ? 0.7 : 1,
                    background: isAdded ? undefined : '#9146ff',
                    borderColor: isAdded ? undefined : '#9146ff',
                  }}
                >
                  {isAdding
                    ? <><Loader2 size={13} className="spin" /> Adding...</>
                    : isAdded
                    ? <><Check size={13} /> Added</>
                    : <><Plus size={13} /> Add</>
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
