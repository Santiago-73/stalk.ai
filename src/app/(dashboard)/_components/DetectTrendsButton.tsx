'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'

interface Props {
  subjectId: string | null
}

export default function DetectTrendsButton({ subjectId }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const router = useRouter()

  async function handleDetect() {
    setLoading(true)
    setResult(null)
    setIsError(false)

    try {
      if (subjectId) {
        const res = await fetch('/api/trends/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject_id: subjectId }),
        })
        const data = await res.json()
        if (data.success) {
          setResult(`${data.trends_detected} trends from ${data.videos_analyzed} videos`)
        } else {
          setResult(data.error || 'Failed to detect trends')
          setIsError(true)
        }
      } else {
        const res = await fetch('/api/trends/detect-all', { method: 'POST' })
        const data = await res.json()
        if (data.success) {
          setResult(`${data.subjects_processed} subjects · ${data.total_trends} trends found`)
        } else {
          setResult(data.error || 'Failed to detect trends')
          setIsError(true)
        }
      }
      router.refresh()
    } catch {
      setResult('Something went wrong')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <button
        onClick={handleDetect}
        disabled={loading}
        className="btn-secondary"
        style={{
          padding: '8px 16px', fontSize: 13,
          opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {loading
          ? <><Loader2 size={14} className="spin" /> Analyzing...</>
          : <><Sparkles size={14} /> Detect Trends</>
        }
      </button>
      {result && (
        <span style={{
          fontSize: 12,
          color: isError ? '#f87171' : '#10b981',
          fontWeight: 500,
        }}>
          {result}
        </span>
      )}
    </div>
  )
}
