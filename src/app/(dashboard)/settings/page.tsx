import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'
import { CreditCard, User, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id ?? '')
        .single()

    const currentPlan = profile?.plan ?? 'free'
    const planInfo = PLANS[currentPlan as keyof typeof PLANS]

    return (
        <div style={{ maxWidth: 700 }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage your account and subscription.</p>
            </div>

            {/* Account info */}
            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <User size={18} color="var(--accent-bright)" />
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>Account</h2>
                </div>
                <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                        <div style={{ marginTop: 4, fontSize: 15, color: 'var(--text-primary)' }}>{user?.email}</div>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current plan</label>
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }}>
                                {planInfo?.name ?? 'Free'}
                            </span>
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
                                background: currentPlan === 'free' ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.15)',
                                color: currentPlan === 'free' ? 'var(--accent-bright)' : 'var(--success)'
                            }}>
                                {currentPlan === 'free' ? 'Free tier' : 'Active'}
                            </span>
                        </div>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            <strong>Sources limit:</strong> {currentPlan === 'ultra' ? 'Unlimited' : currentPlan === 'pro' ? '50 max' : '5 max'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            <strong>Digests:</strong> {currentPlan === 'free' ? 'Weekly (Sundays, no AI)' : 'Daily with AI Summaries'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing */}
            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <CreditCard size={18} color="var(--accent-bright)" />
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>Subscription</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                    {(['pro', 'ultra'] as const).map(plan => {
                        const p = PLANS[plan]
                        const active = currentPlan === plan
                        return (
                            <div key={plan} style={{
                                padding: 20, borderRadius: 12,
                                border: `1px solid ${active ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                                background: active ? 'rgba(124,58,237,0.1)' : 'var(--bg-secondary)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</span>
                                    <span style={{ fontWeight: 800, fontSize: 18 }}>${p.price}<span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></span>
                                </div>
                                <ul style={{ listStyle: 'none', marginBottom: 16 }}>
                                    {p.features.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                            <Check size={12} color="var(--success)" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                {active ? (
                                    <div style={{ fontSize: 13, color: 'var(--accent-bright)', fontWeight: 600 }}>✓ Current plan</div>
                                ) : (
                                    <Link
                                        href={`/api/stripe/checkout?plan=${plan}`}
                                        className="btn-primary"
                                        style={{ fontSize: 13, padding: '8px 16px', justifyContent: 'center', display: 'flex' }}
                                    >
                                        Upgrade to {p.name}
                                    </Link>
                                )}
                            </div>
                        )
                    })}
                </div>

                {currentPlan !== 'free' && (
                    <Link
                        href="/api/stripe/portal"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <ExternalLink size={14} /> Manage billing on Stripe
                    </Link>
                )}
            </div>
        </div>
    )
}
