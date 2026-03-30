'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Plus, Check } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  avatar_url: string | null
  subscribers: string
}

interface Props {
  subjectId: string
  onChannelAdded?: () => void
}

function formatSubs(s: string) {
  return `${s} subs`
}

export default function ChannelSearch({ subjectId, onChannelAdded }: Props) {
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
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&max=5`)
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
      const res = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: channel.id, subject_id: subjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      setAddedIds(prev => new Set([...prev, channel.id]))
      onChannelAdded?.()
      router.refresh()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div>
      {/* Search input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          className="input"
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) setResults([]) }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search YouTube channels..."
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{ padding: '0 20px', opacity: searching || !query.trim() ? 0.7 : 1 }}
        >
          {searching ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
          {searching ? 'Searching...' : 'Search'}
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

      {/* Results */}
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
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: ch.avatar_url ? `url(${ch.avatar_url}) center/cover` : 'rgba(124,58,237,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-bright)', fontWeight: 800, fontSize: 16,
                }}>
                  {!ch.avatar_url && ch.name.charAt(0)}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {ch.name}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatSubs(ch.subscribers)}
                  </div>
                </div>
                {/* Add button */}
                <button
                  className={isAdded ? 'btn-secondary' : 'btn-primary'}
                  onClick={() => !isAdded && handleAdd(ch)}
                  disabled={isAdding || isAdded}
                  style={{
                    padding: '7px 16px', fontSize: 13, flexShrink: 0,
                    opacity: isAdded ? 0.7 : 1,
                  }}
                >
                  {isAdding ? (
                    <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Syncing...</>
                  ) : isAdded ? (
                    <><Check size={13} /> Added</>
                  ) : (
                    <><Plus size={13} /> Add</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
