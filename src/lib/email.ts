import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface DigestItem {
    source_name: string
    source_type: string
    content: string
}

function sourceEmoji(type: string) {
    if (type === 'youtube') return '📺'
    if (type === 'reddit') return '👾'
    return '📡'
}

function formatBullets(content: string): string {
    return content
        .split('\n')
        .filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'))
        .map(l => `<li style="margin:6px 0;color:#d1d5db;line-height:1.6;">${l.replace(/^[-•]\s*/, '')}</li>`)
        .join('')
}

function buildEmailHTML(digests: DigestItem[]): string {
    const sections = digests.map(d => `
    <div style="background:#1e1b2e;border:1px solid #2e2b3e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:18px;">${sourceEmoji(d.source_type)}</span>
        <h2 style="margin:0;font-size:16px;font-weight:700;color:#f3f4f6;">${d.source_name}</h2>
        <span style="margin-left:auto;font-size:11px;padding:2px 8px;border-radius:12px;background:#2d1b69;color:#a78bfa;font-weight:600;text-transform:uppercase;">${d.source_type}</span>
      </div>
      <ul style="margin:0;padding-left:0;list-style:none;">
        ${formatBullets(d.content) || `<li style="color:#9ca3af;">${d.content.slice(0, 300)}</li>`}
      </ul>
    </div>
  `).join('')

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#e879f9);border-radius:12px;padding:12px 20px;margin-bottom:16px;">
        <span style="color:white;font-size:22px;font-weight:800;">Stalk.ai</span>
      </div>
      <h1 style="margin:0;font-size:20px;color:#f3f4f6;font-weight:700;">Your Daily Digest</h1>
      <p style="margin:6px 0 0;color:#6b7280;font-size:14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    </div>

    <!-- Digests -->
    ${sections}

    <!-- Footer -->
    <div style="text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #1f1b2e;">
      <p style="margin:0;color:#4b5563;font-size:12px;">
        You're receiving this because you have sources tracked on Stalk.ai.<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#7c3aed;">View dashboard</a>
      </p>
    </div>

  </div>
</body>
</html>
  `
}

export async function sendDailyDigest(to: string, digests: DigestItem[]) {
    const html = buildEmailHTML(digests)
    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'digest@stalkai.com',
        to,
        subject: `🤖 Your Stalk.ai Daily Digest — ${digests.length} source${digests.length !== 1 ? 's' : ''}`,
        html,
    })
    if (error) throw new Error(`Resend error: ${error.message}`)
    return data
}
