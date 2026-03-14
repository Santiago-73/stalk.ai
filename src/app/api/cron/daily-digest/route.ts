import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDailyDigest } from '@/lib/email'
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Gemini ───────────────────────────────────────────────────────────────────

async function geminiGenerate(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY_PAID
        || process.env.GOOGLE_GEMINI_API_KEY
        || process.env.GOOGLE_GEMINI_API_KEY_FREE
    if (!apiKey) throw new Error('No Gemini API key configured')

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']
    let lastErr = ''
    for (const model of models) {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                signal: AbortSignal.timeout(45000),
            }
        )
        if (res.status === 404) { lastErr = `${model} not found`; continue }
        if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
        const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text) return text
    }
    throw new Error(`No working Gemini model. Last: ${lastErr}`)
}

async function geminiWithRetry(prompt: string, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
        try { return await geminiGenerate(prompt) }
        catch (err) {
            if (String(err).includes('429') && i < retries) {
                await sleep((i + 1) * 3000)
                continue
            }
            throw err
        }
    }
    throw new Error('Max retries exceeded')
}

// ── Source fetchers (return list of titles) ──────────────────────────────────

async function fetchRSSTitles(url: string): Promise<string[]> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Stalk.ai/1.0', 'Accept': 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const parsed = parser.parse(await res.text())
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? {}
    const rawItems = channel.item ?? channel.entry ?? []
    const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 4)
    return items.map((i: { title?: unknown }) => String(i.title ?? '').trim()).filter(Boolean)
}

async function fetchYouTubeTitles(url: string): Promise<string[]> {
    const channelMatch = url.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]+)/)
    const handleMatch = url.match(/youtube\.com\/@([A-Za-z0-9_-]+)/)

    if (channelMatch) return fetchRSSTitles(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`)

    if (handleMatch) {
        const page = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(12000),
        })
        const html = await page.text()
        const idMatch = html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/) || html.match(/"externalId":"(UC[A-Za-z0-9_-]+)"/)
        if (!idMatch) throw new Error('Could not find YouTube channel ID')
        return fetchRSSTitles(`https://www.youtube.com/feeds/videos.xml?channel_id=${idMatch[1]}`)
    }
    throw new Error('Unrecognised YouTube URL')
}

async function fetchRedditTitles(url: string): Promise<string[]> {
    const m = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/)
    if (!m) throw new Error('Bad Reddit URL')
    const res = await fetch(`https://www.reddit.com/r/${m[1]}/hot.json?limit=4`, {
        headers: { 'User-Agent': 'stalk-ai/1.0 by sanespi012' },
        signal: AbortSignal.timeout(10000),
    })
    const text = await res.text()
    if (text.startsWith('<')) throw new Error('Reddit blocked')
    const posts: { data: { title: string } }[] = JSON.parse(text)?.data?.children ?? []
    return posts.slice(0, 4).map(p => p.data.title).filter(Boolean)
}

async function fetchTikTokTitles(url: string): Promise<string[]> {
    const m = url.match(/tiktok\.com\/@([A-Za-z0-9_.]+)/)
    if (!m) throw new Error('Bad TikTok URL')
    const instances = ['https://rsshub.app', 'https://rsshub.rss.plus', 'https://rss.fatpandac.me']
    for (const base of instances) {
        try { return await fetchRSSTitles(`${base}/tiktok/user/@${m[1]}`) } catch { /* try next */ }
    }
    throw new Error('All RSSHub instances failed')
}

async function fetchBlueskyTitles(url: string): Promise<string[]> {
    const m = url.match(/(?:bsky\.app\/profile\/)?(@?[a-zA-Z0-9._-]+)/)
    if (!m) throw new Error('Bad Bluesky URL')
    let handle = m[1].startsWith('@') ? m[1].slice(1) : m[1]
    const profileRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`, { signal: AbortSignal.timeout(10000) })
    if (!profileRes.ok) throw new Error('Bluesky handle not found')
    const did = (await profileRes.json())?.did
    const feedRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}&limit=4`, { signal: AbortSignal.timeout(10000) })
    const posts = (await feedRes.json())?.feed || []
    return posts.slice(0, 4).map((item: { post?: { record?: { text?: string } } }) =>
        item.post?.record?.text?.replace(/\n/g, ' ').slice(0, 200) || ''
    ).filter(Boolean)
}

async function fetchHackerNewsTitles(url: string): Promise<string[]> {
    const listMatch = url.match(/\/(top|new|best|ask|show)/)
    const type = listMatch ? listMatch[1] : 'top'
    const res = await fetch(`https://hacker-news.firebaseio.com/v0/${type}stories.json`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error('HN API failed')
    const ids: number[] = await res.json()
    const stories = await Promise.allSettled(
        ids.slice(0, 4).map(id =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
        )
    )
    return stories
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<{ title?: string }>).value?.title ?? '')
        .filter(Boolean)
}

async function fetchSourceTitles(source: { type: string; url: string }): Promise<string[]> {
    switch (source.type) {
        case 'youtube': return fetchYouTubeTitles(source.url)
        case 'reddit': return fetchRedditTitles(source.url)
        case 'tiktok': return fetchTikTokTitles(source.url)
        case 'bluesky': return fetchBlueskyTitles(source.url)
        case 'hackernews': return fetchHackerNewsTitles(source.url)
        case 'substack': {
            const atMatch = source.url.match(/substack\.com\/@([A-Za-z0-9_-]+)/)
            const feedUrl = atMatch
                ? `https://${atMatch[1]}.substack.com/feed`
                : source.url.includes('/feed') ? source.url : source.url.replace(/\/?$/, '/feed')
            return fetchRSSTitles(feedUrl)
        }
        case 'github': {
            const m = source.url.match(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/)
            if (!m) throw new Error('Bad GitHub URL')
            try { return await fetchRSSTitles(`https://github.com/${m[1]}/releases.atom`) }
            catch { return fetchRSSTitles(`https://github.com/${m[1]}/commits.atom`) }
        }
        case 'medium': {
            const m = source.url.match(/medium\.com\/@?([A-Za-z0-9_.-]+)/) || source.url.match(/([A-Za-z0-9_.-]+)\.medium\.com/)
            if (!m) throw new Error('Bad Medium URL')
            return fetchRSSTitles(`https://medium.com/feed/@${m[1]}`)
        }
        case 'devto': {
            const m = source.url.match(/dev\.to\/([A-Za-z0-9_-]+)/)
            if (!m) throw new Error('Bad Dev.to URL')
            const res = await fetch(`https://dev.to/api/articles?username=${m[1]}&per_page=4`, {
                headers: { 'User-Agent': 'stalk-ai/1.0' }, signal: AbortSignal.timeout(10000),
            })
            const articles = await res.json()
            return articles.slice(0, 4).map((a: { title?: string }) => a.title || '').filter(Boolean)
        }
        default: return fetchRSSTitles(source.url)
    }
}

// ── Route ────────────────────────────────────────────────────────────────────

interface Source { id: string; name: string; type: string; url: string }
interface Subject { id: string; name: string; description: string; sources: Source[] }

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '') ?? req.nextUrl.searchParams.get('secret')
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profiles } = await supabase.from('profiles').select('id, email, plan')
    if (!profiles || profiles.length === 0) return NextResponse.json({ message: 'No users' })

    const results: { user: string; subjects: number; emailed: boolean }[] = []

    for (const profile of profiles) {
        try {
            const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
            const email = authUser?.user?.email
            if (!email) continue

            // Only Pro and Ultra get daily emails
            if (profile.plan === 'free') {
                console.log(`[cron] Skipping free user ${profile.id}`)
                continue
            }

            // Fetch subjects with their sources
            const { data: subjects } = await supabase
                .from('subjects')
                .select('*, sources(*)')
                .eq('user_id', profile.id)

            if (!subjects || subjects.length === 0) continue

            let emailsSent = 0

            for (const subject of subjects as Subject[]) {
                if (!subject.sources || subject.sources.length === 0) continue
                try {
                    // Fetch titles from all sources in parallel
                    const settled = await Promise.allSettled(
                        subject.sources.map(async s => {
                            const titles = await fetchSourceTitles(s)
                            return { name: s.name, titles }
                        })
                    )

                    const allTitles: string[] = []
                    const sourceLines: string[] = []
                    for (const r of settled) {
                        if (r.status === 'fulfilled' && r.value.titles.length > 0) {
                            allTitles.push(...r.value.titles)
                            sourceLines.push(`${r.value.name}:\n${r.value.titles.map(t => `  • ${t}`).join('\n')}`)
                        }
                    }

                    if (allTitles.length === 0) continue

                    const subjectContext = subject.description
                        ? `${subject.name} (${subject.description})`
                        : subject.name

                    const prompt = `You are a concise content summarizer. Below are recent posts/videos from the subject "${subjectContext}", grouped by source. Write a digest in the SAME language as the content using this format:

For each source with content, write:
**[Source Name]:**
• Title — one sentence description of what it's about

At the end, add:
**💡 Resumen:** One sentence (max 20 words) summarizing the overall activity.

No intro text, no extra commentary. Just the format above.

${sourceLines.join('\n\n')}`

                    let content: string
                    try {
                        content = await geminiWithRetry(prompt)
                        await sleep(2000) // throttle between subjects
                    } catch (err) {
                        console.error(`[cron] Gemini failed for subject ${subject.name}:`, err)
                        content = sourceLines.join('\n\n')
                    }

                    // Save digest
                    await supabase.from('digests').insert({
                        user_id: profile.id,
                        subject_id: subject.id,
                        source_name: subject.name,
                        source_type: 'subject',
                        content,
                    })

                    // Send one email per subject
                    await sendDailyDigest(email, [{ subject_name: subject.name, content }])
                    emailsSent++
                    await sleep(1000) // throttle between emails
                } catch (e) {
                    console.error(`[cron] subject ${subject.id}:`, e)
                }
            }

            if (emailsSent > 0) {
                results.push({ user: email, subjects: emailsSent, emailed: true })
            }
        } catch (e) {
            console.error(`[cron] user ${profile.id}:`, e)
        }
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
}
