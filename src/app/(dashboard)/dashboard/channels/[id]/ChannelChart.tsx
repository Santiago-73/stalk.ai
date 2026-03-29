'use client'

import { useState } from 'react'

interface Snapshot {
  snapshot_date: string
  subscribers: number
  total_views: number
  avg_views: number
}

interface Props {
  snapshots: Snapshot[]
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

type Metric = 'subscribers' | 'total_views'

export default function ChannelChart({ snapshots }: Props) {
  const [metric, setMetric] = useState<Metric>('subscribers')
  const [hovered, setHovered] = useState<number | null>(null)

  const metrics: { key: Metric; label: string; color: string }[] = [
    { key: 'subscribers', label: 'Subscribers', color: '#7c3aed' },
    { key: 'total_views', label: 'Total Views', color: '#ff4444' },
  ]

  if (snapshots.length < 2) {
    return (
      <div style={{
        padding: '48px 0', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: 14
      }}>
        Not enough data for chart yet — sync the channel again tomorrow.
      </div>
    )
  }

  const data = snapshots.map(s => ({
    date: s.snapshot_date,
    value: s[metric] ?? 0,
  }))

  const W = 800
  const H = 200
  const PL = 64, PR = 20, PT = 20, PB = 40
  const innerW = W - PL - PR
  const innerH = H - PT - PB

  const values = data.map(d => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const xScale = (i: number) => PL + (i / (data.length - 1)) * innerW
  const yScale = (v: number) => H - PB - ((v - minVal) / range) * innerH

  const polyline = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' ')

  // Filled area path
  const areaPath = [
    `M ${xScale(0)},${H - PB}`,
    ...data.map((d, i) => `L ${xScale(i)},${yScale(d.value)}`),
    `L ${xScale(data.length - 1)},${H - PB}`,
    'Z',
  ].join(' ')

  const color = metrics.find(m => m.key === metric)!.color

  // Y axis ticks (3 labels)
  const yTicks = [minVal, minVal + range / 2, maxVal]

  // X axis: show ~5 evenly spaced date labels
  const xLabelIdxs = [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(3 * data.length / 4), data.length - 1]

  const hPoint = hovered !== null ? data[hovered] : null

  return (
    <div>
      {/* Metric toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              background: metric === m.key ? `${m.color}18` : 'transparent',
              border: `1px solid ${metric === m.key ? m.color : 'var(--border)'}`,
              color: metric === m.key ? m.color : 'var(--text-muted)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* SVG chart */}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          onMouseMove={e => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
            const relX = ((e.clientX - rect.left) / rect.width) * W - PL
            const idx = Math.round((relX / innerW) * (data.length - 1))
            setHovered(Math.max(0, Math.min(data.length - 1, idx)))
          }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((v, i) => (
            <line
              key={i}
              x1={PL} y1={yScale(v)} x2={W - PR} y2={yScale(v)}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#grad-${metric})`} />

          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Y axis labels */}
          {yTicks.map((v, i) => (
            <text
              key={i}
              x={PL - 8} y={yScale(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-muted)"
              fontFamily="monospace"
            >
              {formatNum(v)}
            </text>
          ))}

          {/* X axis labels */}
          {xLabelIdxs.map(i => {
            if (i >= data.length) return null
            const label = data[i].date.slice(5) // MM-DD
            return (
              <text
                key={i}
                x={xScale(i)} y={H - PB + 18}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
                fontFamily="monospace"
              >
                {label}
              </text>
            )
          })}

          {/* Hover indicator */}
          {hovered !== null && (
            <>
              <line
                x1={xScale(hovered)} y1={PT}
                x2={xScale(hovered)} y2={H - PB}
                stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.6"
              />
              <circle
                cx={xScale(hovered)} cy={yScale(data[hovered].value)}
                r="5" fill={color} stroke="var(--bg-card)" strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hPoint && (
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', fontSize: 12, pointerEvents: 'none',
            whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{hPoint.date} · </span>
            <span style={{ color, fontWeight: 700 }}>{formatNum(hPoint.value)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
