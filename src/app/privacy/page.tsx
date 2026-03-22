import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px' }}>
                <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 48 }}>
                    ← Back to Stalk.ai
                </Link>

                <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>Privacy Policy</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 48 }}>Last updated: March 2026</p>

                {[
                    {
                        title: '1. Who we are',
                        body: 'Stalkai (stalk-ai.com) is operated by Santiago Espinosa García, based in Spain. We provide an AI-powered trend detection tool for content creators that aggregates public content from YouTube, Reddit, Twitch, RSS feeds, Hacker News, Bluesky and Substack, and uses Google Gemini to generate trend analysis digests.'
                    },
                    {
                        title: '2. What data we collect',
                        body: 'We collect: (a) Account information — your email address and password (hashed) when you sign up. (b) Usage data — the subjects, sources and digests you create within the platform. (c) Payment data — processed by Stripe; we never store your card details. (d) Basic analytics — page visits and feature usage to improve the product.'
                    },
                    {
                        title: '3. How we use your data',
                        body: 'Your data is used exclusively to provide the Stalk.ai service: authenticate you, generate digests, send you your daily/weekly email summaries, and process payments. We do not sell, rent or share your personal data with third parties for marketing purposes.'
                    },
                    {
                        title: '4. Data retention',
                        body: 'We retain your account data for as long as your account is active. Digests are stored indefinitely so you can access your history. You may request deletion of all your data at any time by contacting us.'
                    },
                    {
                        title: '5. Third-party services',
                        body: 'We use the following third-party services: Supabase (database and authentication, EU region), Resend (transactional email), Stripe (payments), Vercel (hosting), Google Gemini API (AI trend analysis), YouTube Data API (Google), Reddit API, Twitch API. When you add a source, Stalkai fetches only publicly available content from that platform. Each of these services has its own privacy policy.'
                    },
                    {
                        title: '6. Your rights (GDPR)',
                        body: 'As a user based in the EU/EEA, you have the right to: access your personal data, correct inaccurate data, request erasure of your data, object to processing, and data portability. To exercise any of these rights, contact us at the email below.'
                    },
                    {
                        title: '7. Cookies',
                        body: 'We use strictly necessary cookies for authentication (session token). We do not use tracking or advertising cookies. If we add analytics in the future, we will update this policy and request your consent.'
                    },
                    {
                        title: '8. Contact',
                        body: 'For any privacy-related questions or requests, contact us at: hello@stalk-ai.com'
                    },
                ].map((section, i) => (
                    <div key={i} style={{ marginBottom: 40, paddingBottom: 40, borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{section.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>{section.body}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
