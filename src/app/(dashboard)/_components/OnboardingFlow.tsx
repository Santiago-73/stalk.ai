'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AddedChannel {
  id: string
  name: string
  subscribers: number
  synced: boolean
  videoCount?: number
}

interface SearchResult {
  id: string
  name: string
  subscribers: number
  avatar_url?: string
  platform_channel_id: string
}

const quickPicks = [
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '💪', label: 'Fitness' },
  { emoji: '🤖', label: 'AI & Tech' },
  { emoji: '🍳', label: 'Cooking' },
  { emoji: '💰', label: 'Finance' },
  { emoji: '🎨', label: 'Design' },
]

const benefits = [
  'Track new videos from your channels daily',
  'Detect trending topics in your niche',
  'Alert you when a video goes viral',
  'Show you what thumbnails and formats work',
]

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export default function OnboardingFlow({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [nicheName, setNicheName] = useState('')
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null)
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [creating, setCreating] = useState(false)

  // Step 2
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [addedChannels, setAddedChannels] = useState<AddedChannel[]>([])
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

  // Step 3
  const [finishing, setFinishing] = useState(false)

  // Animation
  const [visible, setVisible] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 1) inputRef.current?.focus()
  }, [step])

  function goToStep(next: number) {
    setVisible(false)
    setTimeout(() => { setStep(next); setVisible(true) }, 200)
  }

  async function handleCreateSubject() {
    if (!nicheName.trim() || creating) return
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      // Ensure profile row exists (new users may not have one yet)
      await supabase.from('profiles').upsert({ id: user.id, plan: 'free' }, { onConflict: 'id' })
      const { data, error } = await supabase
        .from('subjects')
        .insert({ name: nicheName.trim(), user_id: user.id })
        .select('id, name')
        .single()
      if (error) throw new Error(error.message)
      setSubjectId(data.id)
      setSubjectName(data.name)
      goToStep(2)
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  async function handleSearch() {
    if (!query.trim() || searching) return
    setSearching(true)
    setResults([])
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&max=5`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }

  async function handleAddChannel(ch: SearchResult) {
    if (!subjectId || addingIds.has(ch.id)) return
    setAddingIds(prev => new Set(prev).add(ch.id))
    setAddedChannels(prev => [...prev, { id: ch.id, name: ch.name, subscribers: ch.subscribers, synced: false }])

    try {
      const res = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://www.youtube.com/channel/${ch.platform_channel_id}`,
          subject_id: subjectId,
        }),
      })
      const data = await res.json()
      setAddedChannels(prev => prev.map(c =>
        c.id === ch.id ? { ...c, synced: true, videoCount: data.videos_synced ?? 0 } : c
      ))
    } catch (e) {
      console.error(e)
      setAddedChannels(prev => prev.map(c => c.id === ch.id ? { ...c, synced: true } : c))
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(ch.id); return s })
    }
  }

  function handleFinish() {
    setFinishing(true)
    router.push('/dashboard')
    router.refresh()
  }

  const totalVideos = addedChannels.reduce((sum, c) => sum + (c.videoCount ?? 0), 0)

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div
        style={{
          maxWidth: 600, width: '100%', padding: '48px 40px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        {/* ── STEP 1: Niche name ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>👋</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Welcome to{' '}
              <span className="gradient-text serif-italic">Stalk-AI</span>
            </h1>
            <p style={{
              color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 32
            }}>
              Let's set up your first niche in 30 seconds.<br />
              You'll be tracking trends before your coffee gets cold.
            </p>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>
              What niche do you create content about?
            </label>
            <input
              ref={inputRef}
              className="input"
              value={nicheName}
              onChange={e => { setNicheName(e.target.value); setSelectedQuick(null) }}
              onKeyDown={e => e.key === 'Enter' && handleCreateSubject()}
              placeholder="e.g. Gaming, Fitness, AI Tools..."
              style={{ width: '100%', fontSize: 16, padding: '14px 18px', marginBottom: 20 }}
            />

            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Quick picks:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {quickPicks.map(q => {
                  const isSelected = selectedQuick === q.label
                  return (
                    <button
                      key={q.label}
                      onClick={() => {
                        setNicheName(q.label)
                        setSelectedQuick(q.label)
                      }}
                      style={{
                        padding: '8px 16px', borderRadius: 100, fontSize: 14,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        background: isSelected ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        color: isSelected ? 'var(--accent-bright)' : 'var(--text-secondary)',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      {q.emoji} {q.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleCreateSubject}
              disabled={!nicheName.trim() || creating}
              className="btn-primary"
              style={{
                width: '100%', padding: '14px 32px', fontSize: 16,
                opacity: nicheName.trim() ? 1 : 0.4,
                cursor: nicheName.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {creating ? <Loader2 size={18} className="spin" /> : <>Continue <ArrowRight size={18} /></>}
            </button>

            <StepDots current={1} />
          </>
        )}

        {/* ── STEP 2: Add channels ── */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📺</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
              Add YouTube channels to track
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              Search for channels in your niche and add at least one.<br />
              We'll sync their latest videos automatically.
            </p>

            {/* Search */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                className="input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search YouTube channels..."
                style={{ flex: 1, fontSize: 15, padding: '12px 16px' }}
              />
              <button
                onClick={handleSearch}
                disabled={!query.trim() || searching}
                className="btn-primary"
                style={{ padding: '12px 20px', fontSize: 14, whiteSpace: 'nowrap' }}
              >
                {searching ? <Loader2 size={16} className="spin" /> : 'Search'}
              </button>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
                {results.map((r, i) => {
                  const isAdded = addedChannels.some(c => c.id === r.id)
                  const isAdding = addingIds.has(r.id)
                  return (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: r.avatar_url ? `url(${r.avatar_url}) center/cover` : 'rgba(124,58,237,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: 'var(--accent-bright)',
                      }}>
                        {!r.avatar_url && r.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatNum(r.subscribers)} subs
                        </div>
                      </div>
                      <button
                        onClick={() => !isAdded && handleAddChannel(r)}
                        disabled={isAdded || isAdding}
                        style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: isAdded ? 'default' : 'pointer', fontFamily: 'inherit',
                          border: '1px solid',
                          background: isAdded ? 'rgba(16,185,129,0.12)' : 'transparent',
                          borderColor: isAdded ? '#10b981' : 'var(--border)',
                          color: isAdded ? '#10b981' : 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
                        }}
                      >
                        {isAdding
                          ? <><Loader2 size={12} className="spin" /> Adding...</>
                          : isAdded
                          ? <><Check size={12} /> Added</>
                          : '+ Add'
                        }
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Added list */}
            {addedChannels.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Added ({addedChannels.length})
                </div>
                {addedChannels.map(ch => (
                  <div key={ch.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, marginBottom: 6,
                  }}>
                    <span style={{ color: ch.synced ? '#10b981' : 'var(--text-muted)', fontSize: 14 }}>
                      {ch.synced ? '✓' : '◌'}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ch.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      · {ch.synced
                        ? `${ch.videoCount ?? 0} videos synced`
                        : 'syncing...'
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => handleFinish()}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--text-muted)', fontFamily: 'inherit',
                  textDecoration: 'none', padding: 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Skip
              </button>
              <button
                onClick={() => goToStep(3)}
                disabled={addedChannels.length === 0}
                className="btn-primary"
                style={{
                  flex: 1, padding: '14px 32px', fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: addedChannels.length > 0 ? 1 : 0.4,
                  cursor: addedChannels.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                Continue <ArrowRight size={17} />
              </button>
            </div>

            <StepDots current={2} />
          </>
        )}

        {/* ── STEP 3: All set ── */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🎉</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>
              You're all set!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Your niche{' '}
              <strong style={{ color: 'var(--text-primary)' }}>"{subjectName}"</strong>{' '}
              is ready
              {addedChannels.length > 0
                ? ` with ${addedChannels.length} channel${addedChannels.length !== 1 ? 's' : ''} and ${totalVideos} videos tracked.`
                : '.'
              }
            </p>

            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14 }}>
                Here's what Stalk-AI will do for you:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {benefits.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      background: 'rgba(16,185,129,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1,
                    }}>
                      <Check size={12} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={finishing}
              className="btn-primary"
              style={{
                width: '100%', padding: '16px 32px', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 0 32px rgba(124,58,237,0.25)',
              }}
            >
              {finishing
                ? <><Loader2 size={18} className="spin" /> Loading...</>
                : <>Go to your dashboard <ArrowRight size={18} /></>
              }
            </button>

            <StepDots current={3} />
          </>
        )}
      </div>
    </div>
  )
}

function StepDots({ current }: { current: number }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40
    }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: n === current ? 'var(--accent)' : 'var(--border)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}
