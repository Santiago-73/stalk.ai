import Link from 'next/link'

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px' }}>
                <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 48 }}>
                    ← Back to Stalk.ai
                </Link>

                <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>Terms of Service</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 48 }}>Last updated: March 2026</p>

                {[
                    {
                        title: '1. Acceptance of terms',
                        body: 'By creating an account or using Stalk.ai, you agree to these Terms of Service. If you do not agree, do not use the service. We reserve the right to update these terms at any time; continued use of the service constitutes acceptance of the new terms.'
                    },
                    {
                        title: '2. Description of the service',
                        body: 'Stalk.ai provides an AI-powered content monitoring service that aggregates publicly available content from social media platforms and RSS feeds and generates AI summaries. The service is provided "as is" and feature availability may vary by plan.'
                    },
                    {
                        title: '3. User accounts',
                        body: 'You are responsible for maintaining the security of your account credentials. You must provide accurate information when registering. You may not share your account with others or use the service for any illegal purpose.'
                    },
                    {
                        title: '4. Acceptable use',
                        body: 'You agree not to: use the service to monitor private individuals not publicly available on social platforms, attempt to scrape or reverse-engineer the platform, use automated means to create accounts or generate excessive API requests, or use the service in any way that violates applicable laws.'
                    },
                    {
                        title: '5. Plans and billing',
                        body: 'Paid plans are billed monthly. You may cancel at any time; cancellation takes effect at the end of the current billing period. We do not offer refunds for partial months. We reserve the right to change pricing with 30 days notice.'
                    },
                    {
                        title: '6. Content and AI-generated summaries',
                        body: 'Stalk.ai aggregates publicly available content from third-party sources. We are not responsible for the accuracy or legality of third-party content. AI-generated summaries are provided for informational purposes only and may contain errors.'
                    },
                    {
                        title: '7. Service availability',
                        body: 'We aim for high availability but do not guarantee uninterrupted service. We are not liable for downtime caused by third-party services (APIs, hosting, AI providers) or planned maintenance. Free plan users may experience lower priority during high load.'
                    },
                    {
                        title: '8. Limitation of liability',
                        body: 'To the maximum extent permitted by law, Stalk.ai shall not be liable for any indirect, incidental, special or consequential damages arising from the use or inability to use the service. Our total liability shall not exceed the amount you paid in the last 3 months.'
                    },
                    {
                        title: '9. Termination',
                        body: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or attempt to harm the service. You may delete your account at any time from the settings page.'
                    },
                    {
                        title: '10. Governing law',
                        body: 'These terms are governed by the laws of Spain. Any disputes shall be resolved in the courts of Spain, unless otherwise required by applicable consumer protection law in your jurisdiction.'
                    },
                    {
                        title: '11. Contact',
                        body: 'For any questions regarding these terms, contact us at: legal@stalk-ai.com'
                    },
                ].map((section, i) => (
                    <div key={i} style={{ marginBottom: 40, paddingBottom: 40, borderBottom: i < 10 ? '1px solid var(--border)' : 'none' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{section.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>{section.body}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
