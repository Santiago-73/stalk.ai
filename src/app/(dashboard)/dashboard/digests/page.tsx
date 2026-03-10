import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Inbox } from 'lucide-react'
import DigestCard from './DigestCard'

interface Digest {
    id: string
    source_id: string
    source_name: string
    source_type: string
    content: string
    created_at: string
    metadata?: any
}


export default async function DigestsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: digests, error } = await supabase
        .from('digests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div style={{ padding: '36px 40px', maxWidth: '100%', width: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Digests
                </h1>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>
                    Your AI-generated summaries from all tracked sources.
                </p>
            </div>

            {/* Content */}
            {error && (
                <div style={{
                    padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 14
                }}>
                    Error loading digests: {error.message}
                </div>
            )}

            {!error && (!digests || digests.length === 0) && (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 40px', gap: 16, textAlign: 'center',
                    border: '1px dashed var(--border)', borderRadius: 20
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Inbox size={28} color="#7c3aed" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                            No digests yet
                        </h3>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
                            Go to Sources and click &quot;Generate digest&quot; to get started.
                        </p>
                    </div>
                </div>
            )}

            {!error && digests && digests.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        marginBottom: 8
                    }}>
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c3aed, #e879f9)'
                        }} />
                        <FileText size={13} style={{ verticalAlign: 'middle' }} />
                        {digests.length} digest{digests.length !== 1 ? 's' : ''} total
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                        gap: 24,
                        width: '100%'
                    }}>
                        {digests.map(d => <DigestCard key={d.id} digest={d} />)}
                    </div>
                </div>
            )}
        </div>
    )
}
