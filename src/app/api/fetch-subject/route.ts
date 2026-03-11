import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

// ── Helpers ─────────────────────────────────────────────────────────────────

function decodeEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}

interface RSSItem {
    title?: string
    description?: string
    summary?: string
    content?: string
    'media:group'?: { 'media:description'?: string }
}

interface FetchedItem {
    title: string
    desc: string
}

function cleanDescription(raw: unknown, isYouTube = false): string {
    if (isYouTube) return '' // YouTube descriptions are always promotional spam
    let text = typeof raw === 'object' && raw !== null
        ? String((raw as Record<string, unknown>)['#text'] ?? '')
        : String(raw ?? '')
    text = decodeEntities(text.replace(/<[^>]*>/g, '')).replace(/\r/g, '').replace(/\s+/g, ' ').trim()
    // Strip at the first URL, social media promo line, or arrow separator
    text = text.split(/https?:\/\//)[0]
    text = text.split(/→|Sígueme|Follow me|Subscribe|Suscríbete|Contact|Twitter|Instagram|TikTok/i)[0]
    return text.trim().slice(0, 200)
}

async function fetchRSS(url: string, isYouTube = false): Promise<FetchedItem[]> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/xml, text/xml, */*'
        },
        signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    const parsed = parser.parse(await res.text())
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? {}
    const rawItems: RSSItem[] = channel.item ?? channel.entry ?? []
    const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 10)
    return items.map(item => {
        const title = decodeEntities(item.title ?? '')
        const rawDesc = item.description ?? item.summary ?? item.content ?? item['media:group']?.['media:description'] ?? ''
        const desc = cleanDescription(rawDesc, isYouTube)
        return { title, desc }
    })
}

async function fetchYouTube(url: string): Promise<FetchedItem[]> {
    const channelMatch = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/)
    const handleMatch = url.match(/youtube\.com\/@([A-Za-z0-9_-]+)/)
    const userMatch = url.match(/youtube\.com\/user\/([A-Za-z0-9_-]+)/)

    if (channelMatch) {
        return fetchRSS(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`, true)
    }

    if (userMatch) {
        try { return await fetchRSS(`https://www.youtube.com/feeds/videos.xml?user=${userMatch[1]}`, true) }
        catch { /* fall through to page scraping */ }
    }

    if (handleMatch || userMatch) {
        const page = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            signal: AbortSignal.timeout(12000)
        })
        const html = await page.text()
        const idMatch =
            html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/) ||
            html.match(/"externalId":"(UC[A-Za-z0-9_-]+)"/) ||
            html.match(/"browseId":"(UC[A-Za-z0-9_-]+)"/) ||
            html.match(/channel_id=(UC[A-Za-z0-9_-]+)/)
        if (!idMatch) throw new Error('Could not find YouTube channel ID — try using the direct channel URL (youtube.com/channel/UC...)')
        return fetchRSS(`https://www.youtube.com/feeds/videos.xml?channel_id=${idMatch[1]}`, true)
    }

    throw new Error('Unrecognised YouTube URL format')
}

async function getRedditAccessToken(): Promise<string> {
    const clientId = process.env.REDDIT_CLIENT_ID
    const clientSecret = process.env.REDDIT_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Error('Reddit API credentials not configured')
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'stalk-ai/1.0 by sanespi012',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Reddit OAuth failed: ${res.status}`)
    const json = await res.json()
    if (!json.access_token) throw new Error('No access token in Reddit response')
    return json.access_token
}

async function fetchReddit(url: string): Promise<FetchedItem[]> {
    const subMatch = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/)
    if (!subMatch) throw new Error('Could not extract subreddit from URL')
    const subreddit = subMatch[1]

    let token: string | null = null
    try { token = await getRedditAccessToken() } catch (e) {
        console.warn('[Reddit/subject] OAuth failed, trying unauthenticated:', e)
    }

    const apiBase = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com'
    const headers: Record<string, string> = { 'User-Agent': 'stalk-ai/1.0 by sanespi012' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${apiBase}/r/${subreddit}/new.json?limit=12`, {
        headers, signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`Reddit API returned ${res.status} for r/${subreddit}`)

    const data = await res.json()
    const posts: any[] = data.data?.children || []
    return posts.slice(0, 10).map((p: any) => ({
        title: p.data.title,
        desc: `Score: ${p.data.score}`,
    }))
}

async function fetchTikTok(url: string): Promise<FetchedItem[]> {
    const handleMatch = url.match(/tiktok\.com\/@([A-Za-z0-9_.]+)/)
    if (!handleMatch) throw new Error('Could not extract TikTok handle. Use format: tiktok.com/@username')
    const handle = handleMatch[1]
    const instances = [
        'https://rsshub.app',
        'https://rsshub.rss.plus',
        'https://rss.fatpandac.me',
    ]
    let lastErr: unknown
    for (const base of instances) {
        try {
            return await fetchRSS(`${base}/tiktok/user/@${handle}`)
        } catch (err) {
            console.warn(`[TikTok/subject] RSSHub instance ${base} failed:`, err)
            lastErr = err
        }
    }
    throw lastErr ?? new Error('All RSSHub instances failed for TikTok')
}

async function fetchTwitter(url: string): Promise<FetchedItem[]> {
    const bearerToken = process.env.TWITTER_API_TOKEN
    if (!bearerToken) throw new Error('Twitter API token not configured')
    const handleMatch = url.match(/twitter\.com\/(@?[A-Za-z0-9_]+)/)
    if (!handleMatch) throw new Error('Could not extract Twitter handle')
    let handle = handleMatch[1]
    if (handle.startsWith('@')) handle = handle.slice(1)
    const userRes = await fetch(
        `https://api.twitter.com/2/users/by/username/${handle}?user.fields=id`,
        { headers: { Authorization: `Bearer ${bearerToken}` }, signal: AbortSignal.timeout(10000) }
    )
    if (!userRes.ok) throw new Error('Twitter user lookup failed')
    const userId = (await userRes.json())?.data?.id
    if (!userId) throw new Error('Could not find Twitter user')
    const tweetsRes = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,public_metrics`,
        { headers: { Authorization: `Bearer ${bearerToken}` }, signal: AbortSignal.timeout(10000) }
    )
    if (!tweetsRes.ok) throw new Error('Failed to fetch tweets')
    const tweets = (await tweetsRes.json())?.data || []
    return tweets.slice(0, 8).map((t: { text?: string; public_metrics?: { like_count?: number } }) => ({
        title: t.text?.replace(/\n/g, ' ').slice(0, 280) || 'Tweet',
        desc: '',
    }))
}

async function fetchBluesky(url: string): Promise<FetchedItem[]> {
    const handleMatch = url.match(/(?:bsky\.app\/profile\/)?(@?[a-zA-Z0-9._-]+)/)
    if (!handleMatch) throw new Error('Could not extract Bluesky handle')
    let handle = handleMatch[1]
    if (handle.startsWith('@')) handle = handle.slice(1)
    const profileRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`, { signal: AbortSignal.timeout(10000) })
    if (!profileRes.ok) throw new Error('Bluesky handle not found')
    const did = (await profileRes.json())?.did
    if (!did) throw new Error('Could not find Bluesky user DID')
    const feedRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}&limit=10`, { signal: AbortSignal.timeout(10000) })
    if (!feedRes.ok) throw new Error('Failed to fetch Bluesky posts')
    const posts = (await feedRes.json())?.feed || []
    return posts.slice(0, 8).map((item: { post?: { record?: { text?: string }; likeCount?: number } }) => ({
        title: item.post?.record?.text?.replace(/\n/g, ' ').slice(0, 280) || 'Post',
        desc: '',
    }))
}

async function fetchSubstack(url: string): Promise<FetchedItem[]> {
    let feedUrl = url
    const atMatch = url.match(/substack\.com\/@([A-Za-z0-9_-]+)/)
    if (atMatch) feedUrl = `https://${atMatch[1]}.substack.com/feed`
    else if (!url.includes('/feed')) feedUrl = url.replace(/\/?$/, '/feed')
    return fetchRSS(feedUrl)
}

async function fetchGitHub(url: string): Promise<FetchedItem[]> {
    const repoMatch = url.match(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/)
    if (!repoMatch) throw new Error('Could not parse GitHub URL. Use format: github.com/owner/repo')
    const repo = repoMatch[1].replace(/\/$/, '')
    try { return await fetchRSS(`https://github.com/${repo}/releases.atom`) }
    catch { return await fetchRSS(`https://github.com/${repo}/commits.atom`) }
}

async function fetchSourceContent(source: { type: string; url: string }): Promise<FetchedItem[]> {
    switch (source.type) {
        case 'youtube': return fetchYouTube(source.url)
        case 'reddit': return fetchReddit(source.url)
        case 'tiktok': return fetchTikTok(source.url)
        case 'twitter': return fetchTwitter(source.url)
        case 'bluesky': return fetchBluesky(source.url)
        case 'substack': return fetchSubstack(source.url)
        case 'github': return fetchGitHub(source.url)
        default: return fetchRSS(source.url)
    }
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function geminiGenerate(prompt: string, apiKey: string): Promise<string> {
    // Try models in order until one works — newer keys require newer models
    const models = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
    ]
    let lastError = ''
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
        if (res.status === 404) {
            lastError = `${model} not found`
            continue
        }
        if (!res.ok) {
            const errBody = await res.text().catch(() => '')
            throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 200)}`)
        }
        const json = await res.json()
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text) return text
    }
    throw new Error(`No working Gemini model found. Last error: ${lastError}`)
}

// ── Route ────────────────────────────────────────────────────────────────────

interface Source {
    id: string
    name: string
    type: string
    url: string
    subject_id: string
}

interface Subject {
    id: string
    name: string
    description: string
    sources: Source[]
}

export async function POST(req: NextRequest) {
    try {
        const { subject_id } = await req.json()
        if (!subject_id) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get subject with its sources
        const { data: subject, error: subErr } = await supabase
            .from('subjects')
            .select('*, sources(*)')
            .eq('id', subject_id)
            .eq('user_id', user.id)
            .single()

        if (subErr || !subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

        const typedSubject = subject as Subject
        if (!typedSubject.sources || typedSubject.sources.length === 0) {
            return NextResponse.json({ error: 'No sources in this subject' }, { status: 422 })
        }

        // Fetch all sources in parallel
        const settled = await Promise.allSettled(
            typedSubject.sources.map(async (source) => {
                const items = await fetchSourceContent(source)
                return { source, items }
            })
        )

        const fetched = settled
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<{ source: Source; items: FetchedItem[] }>).value)
            .filter(f => f.items.length > 0)

        if (fetched.length === 0) return NextResponse.json({ error: 'Could not fetch content from any source' }, { status: 422 })

        const subjectContext = typedSubject.description
            ? `${typedSubject.name} (${typedSubject.description})`
            : typedSubject.name

        // Get user plan
        // Use paid key (Nivel 1) with gemini-2.5-flash
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY_PAID
            || process.env.GOOGLE_GEMINI_API_KEY
            || process.env.GOOGLE_GEMINI_API_KEY_FREE

        // Collect all titles (clean, no desc mixed in)
        const allItems: { title: string; sourceName: string }[] = []
        for (const { source, items } of fetched) {
            for (const item of items) {
                if (item.title) allItems.push({ title: item.title, sourceName: source.name })
            }
        }

        // Ask AI ONLY for short descriptions (simple numbered list — works with any model)
        const titlesList = allItems.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
        const descPrompt = `For each title below, write ONE SHORT sentence (in the same language as the title) describing what this video/post is about. Output ONLY numbered lines matching the input. No extra text.\n\n${titlesList}`

        let descriptions: string[] = []
        try {
            if (apiKey) {
                const raw = await geminiGenerate(descPrompt, apiKey)
                descriptions = raw.split('\n')
                    .filter(l => /^\d+[\.\)]\s/.test(l.trim()))
                    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
                    .filter(l => l.length > 0)
            }
        } catch (err) {
            console.error('[fetch-subject] Gemini descriptions error:', err)
        }

        // Build formatted digest — bold title, AI description (or RSS desc as fallback)
        let digest = ''
        let idx = 0
        for (const { source, items } of fetched) {
            if (items.length === 0) continue
            digest += `**${source.name}:**\n`
            for (const item of items) {
                const aiDesc = descriptions[idx] || ''
                const fallbackDesc = item.desc || ''
                const desc = aiDesc || fallbackDesc
                digest += `• **${item.title}**${desc ? ` — ${desc}` : ''}\n`
                idx++
            }
            digest += '\n'
        }

        // Add takeaway for all tiers
        if (allItems.length > 0 && apiKey) {
            try {
                const takeawayPrompt = `Based on these recent posts from ${subjectContext}: "${allItems.map(t => t.title).join(' | ')}" — write ONE sentence (max 25 words) summarizing the overall recent activity. Write in the same language as the titles.`
                const takeaway = await geminiGenerate(takeawayPrompt, apiKey)
                digest += `**💡 Takeaway:** ${takeaway.trim().replace(/^["']|["']$/g, '')}`
            } catch { /* skip takeaway on error */ }
        }

        // Save digest
        const { data: digestRow, error: digErr } = await supabase
            .from('digests')
            .insert({
                user_id: user.id,
                subject_id: subject_id,
                source_name: typedSubject.name,
                source_type: 'subject',
                content: digest,
            })
            .select()
            .single()

        if (digErr) return NextResponse.json({ error: digErr.message }, { status: 500 })

        return NextResponse.json({ success: true, digest: digestRow, sources_fetched: fetched.length })
    } catch (err: unknown) {
        console.error('[fetch-subject]', err)
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
    }
}
