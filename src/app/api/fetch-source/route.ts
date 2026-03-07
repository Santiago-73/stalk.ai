import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

async function geminiGenerate(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not set')
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(30000),
        }
    )
    if (!res.ok) {
        const body = await res.text()
        const err = new Error(`Gemini API error ${res.status}: ${body}`) as Error & { status: number }
        err.status = res.status
        throw err
    }
    const json = await res.json()
    return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function fallbackDigest(rawContent: string, sourceName: string): string {
    const lines = rawContent.split('\n').filter(Boolean).slice(0, 5)
    const bullets = lines.map(l => l.startsWith('•') ? l : `• ${l}`).join('\n')
    return `📋 Quick digest from ${sourceName} (AI unavailable — quota exceeded):\n\n${bullets}`
}

interface RSSItem {
    title?: string
    description?: string
    summary?: string
    content?: string
    'media:group'?: { 'media:description'?: string }
    link?: string | { '@_href'?: string }
}

async function fetchRSS(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Stalk.ai/1.0 (RSS reader)' },
        signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const parsed = parser.parse(xml)

    // Handle both RSS 2.0 and Atom formats
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? {}
    const rawItems: RSSItem[] = channel.item ?? channel.entry ?? []
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]

    const top = items.slice(0, 8)
    return top
        .map((item) => {
            const title = item.title ?? ''
            const desc =
                item.description ??
                item.summary ??
                item.content ??
                item['media:group']?.['media:description'] ??
                ''
            // Strip HTML tags
            const clean = String(desc).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 400)
            return `• ${title}: ${clean}`
        })
        .join('\n')
}

async function fetchReddit(url: string): Promise<string> {
    // Reject search URLs — only subreddit URLs work
    if (url.includes('/search') || url.includes('?q=')) {
        throw new Error('Reddit search URLs are not supported. Use a subreddit URL like reddit.com/r/ROS2')
    }

    // Extract subreddit from URL and build clean API URL
    const subMatch = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/)
    if (!subMatch) throw new Error('Could not extract subreddit from URL. Use format: reddit.com/r/SUBREDDIT')
    const subreddit = subMatch[1]

    const jsonUrl = `https://www.reddit.com/r/${subreddit}/hot.json`
    const res = await fetch(`${jsonUrl}?limit=10`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stalkbot/1.0)' },
        signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`Reddit returned HTTP ${res.status}`)

    const text = await res.text()
    if (text.trim().startsWith('<')) {
        throw new Error('Reddit blocked the request (returned HTML). Try again in a moment.')
    }

    const json = JSON.parse(text)
    const posts = json?.data?.children ?? []
    return posts
        .slice(0, 8)
        .map((p: { data: { title: string; selftext?: string; score?: number } }) => {
            const { title, selftext, score } = p.data
            const text = (selftext ?? '').slice(0, 300).replace(/\s+/g, ' ')
            return `• [${score} pts] ${title}${text ? ': ' + text : ''}`
        })
        .join('\n')
}

async function fetchYouTube(url: string): Promise<string> {
    // Try to extract channel ID or handle from various YouTube URL formats
    let channelId = ''
    let feedUrl = ''

    const channelMatch = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/)
    const handleMatch = url.match(/youtube\.com\/@([A-Za-z0-9_-]+)/)
    const userMatch = url.match(/youtube\.com\/user\/([A-Za-z0-9_-]+)/)

    if (channelMatch) {
        channelId = channelMatch[1]
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    } else if (handleMatch || userMatch) {
        // For @handles and /user/ we still need the channel ID — scrape the page first
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

export async function POST(req: NextRequest) {
    try {
        const { source_id } = await req.json()
        if (!source_id) return NextResponse.json({ error: 'source_id required' }, { status: 400 })

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get the source
        const { data: source, error: srcErr } = await supabase
            .from('sources')
            .select('*')
            .eq('id', source_id)
            .eq('user_id', user.id)
            .single()

        if (srcErr || !source) return NextResponse.json({ error: 'Source not found' }, { status: 404 })

        // Fetch content from the web
        let rawContent = ''
        if (source.type === 'reddit') {
            rawContent = await fetchReddit(source.url)
        } else if (source.type === 'youtube') {
            rawContent = await fetchYouTube(source.url)
        } else {
            rawContent = await fetchRSS(source.url)
        }

        if (!rawContent) return NextResponse.json({ error: 'No content fetched' }, { status: 422 })

        // Generate digest with Gemini, fall back to rule-based if quota exceeded
        const prompt = `You are a concise content summarizer. Given the following recent posts/items from "${source.name}", write a tight digest of exactly 4–5 bullet points (use • character) in the SAME language as the content. Focus on the most interesting or important items. Be informative but brief. No intro sentence, just bullets.\n\nContent:\n${rawContent}`
        let digest: string
        let geminiUsed = true
        try {
            digest = await geminiGenerate(prompt)
        } catch {
            geminiUsed = false
            digest = fallbackDigest(rawContent, source.name)
        }

        // Save digest to Supabase
        const { data: digestRow, error: digErr } = await supabase
            .from('digests')
            .insert({
                source_id: source.id,
                user_id: user.id,
                content: digest,
                source_name: source.name,
                source_type: source.type,
            })
            .select()
            .single()

        if (digErr) return NextResponse.json({ error: digErr.message }, { status: 500 })

        return NextResponse.json({ success: true, digest: digestRow })
    } catch (err: unknown) {
        console.error('[fetch-source]', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
