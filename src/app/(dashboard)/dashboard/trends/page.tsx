import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'
import TrendsFilter from './TrendsFilter'

export default async function TrendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trends } = await supabase
    .from('trends')
    .select('*, subjects(name)')
    .eq('user_id', user?.id ?? '')
    .neq('status', 'dead')
    .order('strength_score', { ascending: false })

  const all = trends ?? []
  const emerging  = all.filter(t => t.status === 'emerging')
  const peak      = all.filter(t => t.status === 'peak')
  const declining = all.filter(t => t.status === 'declining')

  const badges = [
    { label: 'emerging',  count: emerging.length,  bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    { label: 'peak',      count: peak.length,       bg: 'rgba(255,92,92,0.12)',   color: '#ff7c7c' },
    { label: 'declining', count: declining.length,  bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 32, flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <TrendingUp size={24} color="var(--accent-bright)" /> Trends
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Track trending topics across your niches
          </p>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {badges.map(b => (
            <span key={b.label} className="mono" style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
              background: b.bg, color: b.color, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {b.count} {b.label}
            </span>
          ))}
        </div>
      </div>

      <TrendsFilter trends={all} />
    </div>
  )
}
