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
    const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 4)
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

    const res = await fetch(`${apiBase}/r/${subreddit}/new.json?limit=4`, {
        headers, signal: AbortSignal.timeout(10000),
    })

    // Fallback to public RSS when API returns 403 (private/quarantined subreddit)
    if (res.status === 403) {
        return fetchRSS(`https://www.reddit.com/r/${subreddit}/new/.rss`)
    }

    if (!res.ok) throw new Error(`Reddit API returned ${res.status} for r/${subreddit}`)

    const data = await res.json()
    const posts: any[] = data.data?.children || []
    return posts.slice(0, 4).map((p: any) => ({
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
        'https://rsshub.ktachibana.party',
        'https://hub.slarker.me',
    ]
    let lastErr: unknown
    for (const base of instances) {
        try {
            return await fetchRSS(`${base}/tiktok/user/@${handle}`)
        } catch (err) {
            lastErr = err
        }
    }
    throw lastErr ?? new Error('All RSSHub instances failed for TikTok')
}

async function fetchHackerNews(url: string): Promise<FetchedItem[]> {
    // Support: news.ycombinator.com, or just "hackernews"
    const listMatch = url.match(/\/(top|new|best|ask|show)/)
    const type = listMatch ? listMatch[1] : 'top'
    // Use official HN Firebase API — extremely reliable
    const storiesRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/${type}stories.json`,
        { signal: AbortSignal.timeout(8000) }
    )
    if (!storiesRes.ok) throw new Error('HackerNews API failed')
    const ids: number[] = await storiesRes.json()
    const top10 = ids.slice(0, 4)
    const stories = await Promise.allSettled(
        top10.map(id =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) })
                .then(r => r.json())
        )
    )
    return stories
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<{ title?: string; score?: number; url?: string }>).value)
        .filter(s => s?.title)
        .map(s => ({ title: s.title!, desc: s.score ? `⬆️ ${s.score}` : '' }))
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
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics`,
        { headers: { Authorization: `Bearer ${bearerToken}` }, signal: AbortSignal.timeout(10000) }
    )
    if (!tweetsRes.ok) throw new Error('Failed to fetch tweets')
    const tweets = (await tweetsRes.json())?.data || []
    return tweets.slice(0, 4).map((t: { text?: string; public_metrics?: { like_count?: number } }) => ({
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
    const feedRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}&limit=4`, { signal: AbortSignal.timeout(10000) })
    if (!feedRes.ok) throw new Error('Failed to fetch Bluesky posts')
    const posts = (await feedRes.json())?.feed || []
    return posts.slice(0, 4).map((item: { post?: { record?: { text?: string }; likeCount?: number } }) => ({
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

async function fetchMedium(url: string): Promise<FetchedItem[]> {
    const handleMatch = url.match(/medium\.com\/@?([A-Za-z0-9_.-]+)/) || url.match(/([A-Za-z0-9_.-]+)\.medium\.com/)
    if (!handleMatch) throw new Error('Could not extract Medium username')
    const username = handleMatch[1]
    return fetchRSS(`https://medium.com/feed/@${username}`)
}

async function fetchTwitch(url: string): Promise<FetchedItem[]> {
    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Error('Twitch API credentials not configured')
    const handleMatch = url.match(/twitch\.tv\/([A-Za-z0-9_]+)/)
    if (!handleMatch) throw new Error('Could not extract Twitch username')
    const username = handleMatch[1]
    // Get OAuth token
    const tokenRes = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: 'POST', signal: AbortSignal.timeout(8000) }
    )
    if (!tokenRes.ok) throw new Error('Twitch OAuth failed')
    const { access_token } = await tokenRes.json()
    const headers = { 'Client-ID': clientId, 'Authorization': `Bearer ${access_token}` }
    // Get user ID
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, { headers, signal: AbortSignal.timeout(8000) })
    if (!userRes.ok) throw new Error('Twitch user not found')
    const userId = (await userRes.json())?.data?.[0]?.id
    if (!userId) throw new Error('Could not find Twitch user')
    // Get recent videos (all types: archive, highlight, upload)
    const videosRes = await fetch(
        `https://api.twitch.tv/helix/videos?user_id=${userId}&first=4`,
        { headers, signal: AbortSignal.timeout(8000) }
    )
    if (!videosRes.ok) throw new Error('Failed to fetch Twitch videos')
    const videos = (await videosRes.json())?.data || []
    if (videos.length > 0) {
        return videos.map((v: { title?: string; view_count?: number }) => ({
            title: v.title || 'Stream',
            desc: v.view_count ? `👁 ${v.view_count.toLocaleString()} views` : '',
        }))
    }
    // Fallback: recent clips
    const clipsRes = await fetch(
        `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=4`,
        { headers, signal: AbortSignal.timeout(8000) }
    )
    if (!clipsRes.ok) throw new Error('Failed to fetch Twitch clips')
    const clips = (await clipsRes.json())?.data || []
    return clips.map((c: { title?: string; view_count?: number }) => ({
        title: c.title || 'Clip',
        desc: c.view_count ? `👁 ${c.view_count.toLocaleString()} views` : '',
    }))
}

async function fetchDevTo(url: string): Promise<FetchedItem[]> {
    const handleMatch = url.match(/dev\.to\/([A-Za-z0-9_-]+)/)
    if (!handleMatch) throw new Error('Could not extract Dev.to username')
    const username = handleMatch[1]
    const res = await fetch(
        `https://dev.to/api/articles?username=${username}&per_page=4`,
        { headers: { 'User-Agent': 'stalk-ai/1.0' }, signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) throw new Error(`Dev.to API returned ${res.status}`)
    const articles = await res.json()
    return articles.slice(0, 4).map((a: { title?: string; positive_reactions_count?: number }) => ({
        title: a.title || 'Article',
        desc: a.positive_reactions_count ? `❤️ ${a.positive_reactions_count}` : '',
    }))
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
        case 'hackernews': return fetchHackerNews(source.url)
        case 'medium': return fetchMedium(source.url)
        case 'twitch': return fetchTwitch(source.url)
        case 'devto': return fetchDevTo(source.url)
        default: return fetchRSS(source.url)
    }
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function geminiGenerate(prompt: string, apiKey: string, premium = false): Promise<string> {
    const models = premium
        ? ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
        : ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']
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

        // Check daily digest limit per subject
        const { data: planData } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        const plan = planData?.plan ?? 'free'
        const dailyLimit = plan === 'free' ? 1 : Infinity

        if (dailyLimit !== Infinity) {
            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)
            const { count } = await supabase
                .from('digests')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('subject_id', subject_id)
                .gte('created_at', startOfDay.toISOString())
            if ((count ?? 0) >= dailyLimit) {
                const limitLabel = dailyLimit === 1 ? '1 digest per subject per day' : `${dailyLimit} digests per subject per day`
                return NextResponse.json({ error: `Daily limit reached. Your plan allows ${limitLabel}.` }, { status: 429 })
            }
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

        const failed = settled
            .map((r, i) => ({ r, source: typedSubject.sources[i] }))
            .filter(({ r }) => r.status === 'rejected')
            .map(({ r, source }) => ({ name: source.name, type: source.type, error: (r as PromiseRejectedResult).reason?.message ?? String((r as PromiseRejectedResult).reason) }))

        console.error('[fetch-subject] failed sources:', JSON.stringify(failed))

        if (fetched.length === 0) return NextResponse.json({ error: 'Could not fetch content from any source', failed }, { status: 422 })

        const isPremium = plan === 'pro' || plan === 'ultra'

        const apiKey = process.env.GOOGLE_GEMINI_API_KEY_PAID
            || process.env.GOOGLE_GEMINI_API_KEY
            || process.env.GOOGLE_GEMINI_API_KEY_FREE

        // Trend Analysis — the entire digest is the AI analysis, no raw listing
        const sourceLines = fetched.flatMap(({ source, items }) =>
            items.map(item => `[${source.name}] ${item.title}${item.desc ? ` — ${item.desc}` : ''}`)
        ).join('\n')

        let digest = sourceLines // fallback if Gemini fails

        if (apiKey) {
            try {
                const descriptionLine = typedSubject.description
                    ? `\ndescribed as: "${typedSubject.description}"`
                    : ''

                const trendPrompt = `You are a trend analyst for content creators.

You are analyzing content for a subject called "${typedSubject.name}"${descriptionLine}.

Below are the most recent posts/videos from multiple sources related to this subject. Analyze them together and provide:

1. **Main trend this week:** What specific topic or format is gaining traction across these sources right now? Be concrete, not generic.

2. **What creators should know:** What is the audience engaging with? What angle or approach is working? Give specific examples from the content analyzed.

3. **Actionable insight:** One specific, concrete thing a creator in this niche could do THIS WEEK with this information. Not generic advice.

Write in the same language as the content. If the content is in Spanish, respond in Spanish. If in English, respond in English. Be specific and actionable. Avoid generic statements that would apply to any niche. If there is not enough data to detect a real trend, say so honestly.

Sources analyzed:
${sourceLines}`

                const raw = await geminiGenerate(trendPrompt, apiKey, isPremium)
                // Strip any intro line Gemini adds before the actual analysis
                digest = raw.replace(/^[^\n*1].*\n+/, '').trim()
            } catch { /* keep raw fallback */ }
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

        return NextResponse.json({ success: true, digest: digestRow, sources_fetched: fetched.length, sources_failed: failed })
    } catch (err: unknown) {
        console.error('[fetch-subject]', err)
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
    }
}
