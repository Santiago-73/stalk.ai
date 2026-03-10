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

async function fetchRSS(url: string): Promise<string> {
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
    const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 8)
    return items.map(item => {
        const title = decodeEntities(item.title ?? '')
        let rawDesc = item.description ?? item.summary ?? item.content ?? item['media:group']?.['media:description'] ?? ''
        if (typeof rawDesc === 'object' && rawDesc !== null) rawDesc = String((rawDesc as Record<string, unknown>)['#text'] ?? '')
        const clean = decodeEntities(String(rawDesc).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim().slice(0, 400)
        return `• ${title}: ${clean}`
    }).join('\n')
}

async function fetchYouTube(url: string): Promise<string> {
    const channelMatch = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/)
    const handleMatch = url.match(/youtube\.com\/@([A-Za-z0-9_-]+)/)
    const userMatch = url.match(/youtube\.com\/user\/([A-Za-z0-9_-]+)/)

    let feedUrl = ''
    if (channelMatch) {
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`
    } else if (handleMatch || userMatch) {
        const page = await fetch(url, { signal: AbortSignal.timeout(10000) })
        const html = await page.text()
        const idMatch = html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/)
        if (!idMatch) throw new Error('Could not find YouTube channel ID')
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${idMatch[1]}`
    } else {
        throw new Error('Unrecognised YouTube URL format')
    }
    return fetchRSS(feedUrl)
}

async function fetchReddit(url: string): Promise<string> {
    const subMatch = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/)
    if (!subMatch) throw new Error('Could not extract subreddit from URL')
    return fetchRSS(`https://www.reddit.com/r/${subMatch[1]}/.rss`)
}

async function fetchTikTok(url: string): Promise<string> {
    const handleMatch = url.match(/tiktok\.com\/@([A-Za-z0-9_.]+)/)
    if (!handleMatch) throw new Error('Could not extract TikTok handle. Use format: tiktok.com/@username')
    const handle = handleMatch[1]
    // Use RSSHub public instance to get TikTok feed as RSS
    return fetchRSS(`https://rsshub.app/tiktok/user/@${handle}`)
}

async function fetchTwitter(url: string): Promise<string> {
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
    return tweets.slice(0, 8).map((t: { text?: string; public_metrics?: { like_count?: number; retweet_count?: number } }) => {
        const text = t.text?.replace(/\n/g, ' ').slice(0, 300) || 'Tweet'
        const likes = t.public_metrics?.like_count || 0
        return `• ${text} [❤️ ${likes}]`
    }).join('\n')
}

async function fetchBluesky(url: string): Promise<string> {
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
    return posts.slice(0, 8).map((item: { post?: { record?: { text?: string }; likeCount?: number } }) => {
        const text = item.post?.record?.text?.replace(/\n/g, ' ').slice(0, 300) || 'Post'
        const likes = item.post?.likeCount || 0
        return `• ${text} [❤️ ${likes}]`
    }).join('\n')
}

async function fetchSourceContent(source: { type: string; url: string }): Promise<string> {
    switch (source.type) {
        case 'youtube': return fetchYouTube(source.url)
        case 'reddit': return fetchReddit(source.url)
        case 'tiktok': return fetchTikTok(source.url)
        case 'twitter': return fetchTwitter(source.url)
        case 'bluesky': return fetchBluesky(source.url)
        default: return fetchRSS(source.url)
    }
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function geminiGenerate(prompt: string, apiKey: string, isPaid: boolean): Promise<string> {
    const model = isPaid ? 'gemini-1.5-pro' : 'gemini-2.0-flash-lite'
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(45000),
        }
    )
    if (!res.ok) throw new Error(`Gemini ${res.status}`)
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text) throw new Error('Empty Gemini response')
    return text
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
                const content = await fetchSourceContent(source)
                return { source, content }
            })
        )

        const fetched = settled
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<{ source: Source; content: string }>).value)
            .filter(f => f.content.trim().length > 0)

        if (fetched.length === 0) return NextResponse.json({ error: 'Could not fetch content from any source' }, { status: 422 })

        // Build unified prompt
        const sourceSections = fetched
            .map(({ source, content }) => `--- ${source.name} (${source.type.toUpperCase()}) ---\n${content}`)
            .join('\n\n')

        const subjectContext = typedSubject.description
            ? `${typedSubject.name} (${typedSubject.description})`
            : typedSubject.name

        const prompt = `You are an expert analyst and content curator.

Below is recent content collected from multiple social media channels and feeds belonging to "${subjectContext}".

Your task: write a unified digest of the most important and relevant information about ${typedSubject.name} based on ALL sources combined. Highlight key announcements, trends, or noteworthy moments. Use bullet points (• character), 5–7 bullets max. Be concise and insightful. Write in the same language as the majority of the content.

${sourceSections}`

        // Get user plan
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        const isPaid = profile?.plan === 'pro' || profile?.plan === 'ultra'
        const apiKey = isPaid
            ? (process.env.GOOGLE_GEMINI_API_KEY_PAID || process.env.GOOGLE_GEMINI_API_KEY)
            : (process.env.GOOGLE_GEMINI_API_KEY_FREE || process.env.GOOGLE_GEMINI_API_KEY)

        let digest: string
        try {
            if (!apiKey) throw new Error('No Gemini API key')
            digest = await geminiGenerate(prompt, apiKey, isPaid)
        } catch (err) {
            console.error('[fetch-subject] Gemini error:', err)
            // Fallback: concatenate top lines from each source
            digest = fetched.map(({ source, content }) =>
                `**${source.name}:**\n${content.split('\n').slice(0, 3).join('\n')}`
            ).join('\n\n')
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
