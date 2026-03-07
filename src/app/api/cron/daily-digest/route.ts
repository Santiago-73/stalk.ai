import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDailyDigest } from '@/lib/email'
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

// Gemini model by plan
function geminiModel(plan: string | null): string {
    if (plan === 'pro' || plan === 'ultra') return 'gemini-2.0-flash-001'
    return 'gemini-2.0-flash-001'
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function geminiGenerateWithRetry(prompt: string, model: string, retries = 2): Promise<string> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await geminiGenerate(prompt, model)
        } catch (err) {
            const msg = String(err)
            if (msg.includes('429') && attempt < retries) {
                console.log(`[cron] Rate limited, waiting ${(attempt + 1) * 3}s before retry...`)
                await sleep((attempt + 1) * 3000)
                continue
            }
            throw err
        }
    }
    throw new Error('Max retries exceeded')
}

async function geminiGenerate(prompt: string, model: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not set')
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(45000),
        }
    )
    if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`)
    }
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text) throw new Error('Gemini returned empty text')
    return text
}

// RSS / YouTube helper
async function fetchRSS(url: string): Promise<string> {
    const res = await fetch(url, { headers: { 'User-Agent': 'Stalk.ai/1.0' }, signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const parsed = parser.parse(await res.text())
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? {}
    const rawItems = channel.item ?? channel.entry ?? []
    const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 8)
    return items.map((i: { title?: string; description?: string; summary?: string }) =>
        `• ${i.title ?? ''}: ${String(i.description ?? i.summary ?? '').replace(/<[^>]*>/g, '').slice(0, 300)}`
    ).join('\n')
}

async function fetchYouTube(url: string): Promise<string> {
    const m = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/)
    if (!m) throw new Error('Bad YouTube URL')
    return fetchRSS(`https://www.youtube.com/feeds/videos.xml?channel_id=${m[1]}`)
}

interface RedditPost {
    title: string
    score: number
    num_comments: number
    thumbnail: string
    url: string
    permalink: string
    selftext: string
    preview?: { images?: { source?: { url?: string } }[] }
}

interface RedditResult {
    subreddit: string
    raw: string
    thumbnails: { title: string; thumb: string; permalink: string; score: number }[]
}

async function fetchReddit(url: string): Promise<RedditResult> {
    const m = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/)
    if (!m) throw new Error('Bad Reddit URL')
    const subreddit = m[1]
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stalkbot/1.0)' },
        signal: AbortSignal.timeout(10000),
    })
    const text = await res.text()
    if (text.startsWith('<')) throw new Error('Reddit blocked')
    const posts: { data: RedditPost }[] = JSON.parse(text)?.data?.children ?? []

    const cleanText = (s: string) => s
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/https?:\/\/\S+/g, '').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim()

    const lines: string[] = []
    const thumbnails: RedditResult['thumbnails'] = []

    for (const { data: p } of posts.slice(0, 10)) {
        const body = p.selftext ? cleanText(p.selftext).slice(0, 250) : ''
        const line = `• [${p.score ?? 0} pts, ${p.num_comments ?? 0} comentarios] ${p.title}`
        lines.push(body ? `${line}\n  Contexto: ${body}` : line)

        // Collect thumbnail - prefer preview image, fallback to thumbnail
        const previewUrl = p.preview?.images?.[0]?.source?.url
            ?.replace(/&amp;/g, '&')
        const thumbUrl = previewUrl
            || (p.thumbnail && !['self', 'default', 'nsfw', 'spoiler', ''].includes(p.thumbnail)
                ? p.thumbnail : null)

        if (thumbUrl) {
            thumbnails.push({
                title: p.title,
                thumb: thumbUrl,
                permalink: `https://reddit.com${p.permalink}`,
                score: p.score ?? 0,
            })
        }
    }

    return { subreddit, raw: lines.join('\n\n'), thumbnails }
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    const bearerToken = authHeader?.replace('Bearer ', '')
    const querySecret = req.nextUrl.searchParams.get('secret')
    const secret = bearerToken ?? querySecret

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profiles } = await supabase.from('profiles').select('id, email, plan')

    if (!profiles || profiles.length === 0) {
        return NextResponse.json({ message: 'No users' })
    }

    const results: { user: string; digests: number; emailed: boolean }[] = []

    for (const profile of profiles) {
        try {
            const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
            const email = authUser?.user?.email
            if (!email) continue

            // Enforce Weekly Digest for Free tier (runs only on Sundays)
            if (profile.plan === 'free' && new Date().getDay() !== 0) {
                console.log(`[cron] Skipping free user ${profile.id} (not Sunday)`)
                continue
            }

            const { data: sources } = await supabase
                .from('sources')
                .select('*')
                .eq('user_id', profile.id)

            if (!sources || sources.length === 0) continue

            const model = geminiModel(profile.plan)
            const digestItems: { source_name: string; source_type: string; content: string }[] = []

            for (const source of sources) {
                try {
                    let raw = ''
                    let prompt: string
                    let metadata: Record<string, unknown> | null = null

                    if (source.type === 'youtube') {
                        raw = await fetchYouTube(source.url)
                        prompt = `You are a concise content summarizer. Summarize these recent YouTube videos from "${source.name}" in 4–5 bullet points (• character). Same language as content. No intro, just bullets.\n\n${raw}`

                    } else if (source.type === 'reddit') {
                        const result = await fetchReddit(source.url)
                        raw = result.raw
                        if (result.thumbnails.length > 0) {
                            metadata = { thumbnails: result.thumbnails }
                        }
                        prompt = `You are a Reddit analyst. Write a digest of r/${result.subreddit} in the SAME language as the posts below.

Use this EXACT format (keep the bold headers with emojis):

**🔥 Lo más destacado:** Write 1-2 sentences describing the main trend or topic dominating the subreddit right now.

**📌 Discusiones clave:**
• Post title here — why it matters, key insight or community reaction (mention score if notable)
• Post title here — why it matters, key insight or community reaction
• Post title here — why it matters, key insight or community reaction
• Post title here — why it matters, key insight or community reaction

**💡 Conclusión:** One sentence summarizing what this tells us about the community or topic today.

Here are the top posts:
${raw}`

                    } else {
                        raw = await fetchRSS(source.url)
                        prompt = `You are a concise content summarizer. Summarize these recent items from "${source.name}" in 4–5 bullet points (• character). Same language as content. No intro, just bullets.\n\n${raw}`
                    }

                    if (!raw) continue

                    let content: string

                    if (model) {
                        try {
                            content = await geminiGenerateWithRetry(prompt, model)
                            console.log(`[cron] ✅ Gemini OK for ${source.name} (${content.length} chars)`)
                        } catch (geminiErr) {
                            console.error(`[cron] ❌ Gemini failed for ${source.name}:`, geminiErr)
                            if (source.type === 'reddit') {
                                const posts = raw.split('\n\n').slice(0, 4)
                                content = `**🔥 Lo más destacado:**\nTrending topics and top discussions from r/${source.name} today.\n\n**📌 Discusiones clave:**\n` +
                                    posts.map(p => {
                                        const lines = p.split('\n')
                                        const titleLine = lines[0].replace(/^•\s*/, '')
                                        const contextLine = lines[1] ? lines[1].replace(/^\s*Contexto:\s*/, '') : 'Popular discussion'
                                        return `• ${titleLine} — ${contextLine.slice(0, 100)}...`
                                    }).join('\n') +
                                    `\n\n**💡 Conclusión:**\nThe community is actively discussing these topics right now.`
                            } else {
                                content = raw.split('\n').slice(0, 6).join('\n')
                            }
                        }
                        // Throttle between sources to avoid rate limits
                        await sleep(2000)
                    } else {
                        // Free plan gets no AI, straight to fallback
                        if (source.type === 'reddit') {
                            const posts = raw.split('\n\n').slice(0, 4)
                            content = `**🔥 Lo más destacado:**\nTrending topics and top discussions from r/${source.name} today.\n\n**📌 Discusiones clave:**\n` +
                                posts.map(p => {
                                    const lines = p.split('\n')
                                    const titleLine = lines[0].replace(/^•\s*/, '')
                                    const contextLine = lines[1] ? lines[1].replace(/^\s*Contexto:\s*/, '') : 'Popular discussion'
                                    return `• ${titleLine} — ${contextLine.slice(0, 100)}...`
                                }).join('\n') +
                                `\n\n**💡 Conclusión:**\nThe community is actively discussing these topics right now.`
                        } else {
                            content = raw.split('\n').slice(0, 6).join('\n')
                        }
                    }

                    // Save to DB (with metadata if available)
                    const insertData: Record<string, unknown> = {
                        source_id: source.id,
                        user_id: profile.id,
                        content,
                        source_name: source.name,
                        source_type: source.type,
                    }
                    if (metadata) insertData.metadata = metadata

                    await supabase.from('digests').insert(insertData)
                    digestItems.push({ source_name: source.name, source_type: source.type, content })

                } catch (e) {
                    console.error(`[cron] source ${source.id}:`, e)
                }
            }

            if (digestItems.length > 0) {
                await sendDailyDigest(email, digestItems)
                results.push({ user: email, digests: digestItems.length, emailed: true })
            }
        } catch (e) {
            console.error(`[cron] user ${profile.id}:`, e)
        }
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
}
