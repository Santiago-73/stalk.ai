import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface DigestItem {
    subject_name: string
    content: string
}

function formatContent(content: string): string {
    return content
        .split('\n')
        .map(line => {
            const t = line.trim()
            if (!t) return ''
            if (t.startsWith('**') && t.endsWith('**')) {
                const label = t.slice(2, -2)
                return `<p style="margin:16px 0 6px;font-size:13px;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:0.05em;">${label}</p>`
            }
            if (t.startsWith('**') && t.includes(':**')) {
                const rest = t.replace(/\*\*/g, '')
                return `<p style="margin:14px 0 4px;font-size:14px;font-weight:700;color:#e2e8f0;">${rest}</p>`
            }
            if (t.startsWith('•')) {
                const text = t.slice(1).trim()
                return `<li style="margin:5px 0;color:#d1d5db;line-height:1.6;font-size:14px;">${text}</li>`
            }
            return `<p style="margin:4px 0;color:#9ca3af;font-size:13px;">${t}</p>`
        })
        .join('')
}

function buildEmailHTML(digests: DigestItem[]): string {
    const sections = digests.map(d => `
    <div style="background:#1e1b2e;border:1px solid #2e2b3e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h2 style="margin:0 0 16px;font-size:17px;font-weight:800;color:#f3f4f6;">📋 ${d.subject_name}</h2>
      <ul style="margin:0;padding-left:0;list-style:none;">
        ${formatContent(d.content)}
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
        You're receiving this because you have subjects tracked on Stalk.ai.<br>
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
        subject: `🤖 Your Stalk.ai Daily Digest — ${digests.length} subject${digests.length !== 1 ? 's' : ''}`,
        html,
    })
    if (error) throw new Error(`Resend error: ${error.message}`)
    return data
}
