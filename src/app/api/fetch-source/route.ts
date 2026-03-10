import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

async function geminiGenerate(prompt: string, apiKey: string, isPaid: boolean = false): Promise<string> {
    // Use current 2.x models since 1.5 is deprecated in 2026 and returns 404
    const model = isPaid ? 'gemini-2.5-flash' : 'gemini-2.0-flash-lite'
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(30000),
        }
    )
    if (!res.ok) {
        const body = await res.text()
        console.error(`[Gemini Request Failed] URL: ${res.url.replace(/key=.*$/, 'key=HIDDEN')} Model: ${model}, Status: ${res.status}, Response: ${body}`)
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
    'media:content'?: { '@_url'?: string }
    link?: string | { '@_href'?: string }
}

function decodeEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#32;/g, ' ')
        .replace(/&nbsp;/g, ' ')
}

// --- Fetchers ---

interface Thumbnail {
    title: string
    thumb: string
    permalink: string
    score?: number
}

interface FetchResult {
    text: string
    thumbnails: Thumbnail[]
}

async function fetchRSS(url: string): Promise<FetchResult> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*'
        },
        signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const parsed = parser.parse(xml)

    // Handle both RSS 2.0 and Atom formats
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? {}
    const rawItems: RSSItem[] = channel.item ?? channel.entry ?? []
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]
    
    const thumbnails: Thumbnail[] = []

    const top = items.slice(0, 8)
    const text = top
        .map((item) => {
            const title = decodeEntities(item.title ?? '')

            // Extract description, handling potential objects from fast-xml-parser
            let rawDesc = item.description ?? item.summary ?? item.content ?? item['media:group']?.['media:description'] ?? ''
            if (typeof rawDesc === 'object' && rawDesc !== null) {
                rawDesc = (rawDesc as any)['#text'] ?? (rawDesc as any)._text ?? JSON.stringify(rawDesc)
            }
            
            // Try to extract an image from the raw description html if it exists
            const imgMatch = typeof rawDesc === 'string' ? rawDesc.match(/<img[^>]+src="([^">]+)"/) : null
            let thumbUrl = ''
            if (imgMatch) thumbUrl = imgMatch[1]
            else if (item['media:content'] && item['media:content']['@_url']) thumbUrl = item['media:content']['@_url']
            
            const link = typeof item.link === 'string' ? item.link : (item.link?.['@_href'] || '')
            
            if (thumbUrl && link && thumbnails.length < 5) {
                thumbnails.push({ title, thumb: thumbUrl, permalink: link })
            }

            // Strip HTML tags, decode entities, and clean up
            const clean = decodeEntities(String(rawDesc).replace(/<[^>]*>/g, ''))
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 400)
            return `• ${title}: ${clean}`
        })
        .join('\n')
        
    return { text, thumbnails }
}

async function fetchReddit(url: string): Promise<FetchResult> {
    // Reject search URLs — only subreddit URLs work
    if (url.includes('/search') || url.includes('?q=')) {
        throw new Error('Reddit search URLs are not supported. Use a subreddit URL like reddit.com/r/ROS2')
    }

    // Extract subreddit from URL
    const subMatch = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/)
    if (!subMatch) throw new Error('Could not extract subreddit from URL. Use format: reddit.com/r/SUBREDDIT')
    const subreddit = subMatch[1]

    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, {
        headers: { 'User-Agent': 'StalkAi/1.0' }
    })
    
    // Reddit API blocks us sometimes, fallback to RSS
    if (!res.ok) {
        console.warn(`Reddit JSON API failed for ${subreddit}, falling back to RSS`)
        const rssUrl = `https://www.reddit.com/r/${subreddit}/.rss`
        return fetchRSS(rssUrl)
    }
    
    const data = await res.json()
    const posts = data.data?.children || []
    const thumbnails: Thumbnail[] = []
    
    const text = posts.map((p: any) => {
        const title = p.data.title
        const score = p.data.score
        const link = `https://reddit.com${p.data.permalink}`
        
        let thumb = ''
        if (p.data.preview?.images?.[0]?.source?.url) {
            thumb = p.data.preview.images[0].source.url.replace(/&amp;/g, '&')
        } else if (p.data.thumbnail && p.data.thumbnail !== 'self' && p.data.thumbnail !== 'default') {
            thumb = p.data.thumbnail
        }

        if (thumb && link && thumbnails.length < 5) {
            thumbnails.push({ title, thumb, permalink: link, score })
        }

        return `Title: ${title} (Score: ${score})\nLink: ${link}\n---`
    }).join('\n')
    
    return { text, thumbnails }
}

async function fetchYouTube(url: string): Promise<FetchResult> {
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
        const page = await fetch(url, { signal: AbortSignal.timeout(10000) })
        const html = await page.text()
        const idMatch = html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/)
        if (!idMatch) throw new Error('Could not find YouTube channel ID')
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${idMatch[1]}`
    } else {
        throw new Error('Unrecognised YouTube URL format')
    }

    const rssData = await fetchRSS(feedUrl)
    return rssData
}

async function fetchTwitter(url: string): Promise<FetchResult> {
    const bearerToken = process.env.TWITTER_API_TOKEN
    if (!bearerToken) throw new Error('Twitter API token not configured')

    const handleMatch = url.match(/twitter\.com\/(@?[A-Za-z0-9_]+)/)
    if (!handleMatch) throw new Error('Could not extract Twitter handle from URL. Use format: twitter.com/@handle')

    let handle = handleMatch[1]
    if (handle.startsWith('@')) handle = handle.slice(1)

    try {
        const userRes = await fetch(
            `https://api.twitter.com/2/users/by/username/${handle}?user.fields=id,name,public_metrics`,
            { headers: { Authorization: `Bearer ${bearerToken}` }, signal: AbortSignal.timeout(10000) }
        )

        if (!userRes.ok) throw new Error(`Twitter user lookup failed`)
        const userData = await userRes.json()
        const userId = userData?.data?.id
        if (!userId) throw new Error('Could not find Twitter user')

        const tweetsRes = await fetch(
            `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,public_metrics,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url`,
            { headers: { Authorization: `Bearer ${bearerToken}` }, signal: AbortSignal.timeout(10000) }
        )

        if (!tweetsRes.ok) throw new Error('Failed to fetch tweets')
        const tweetsData = await tweetsRes.json()
        const tweets = tweetsData?.data || []
        const media = tweetsData?.includes?.media || []
        
        if (tweets.length === 0) throw new Error('No tweets found')
        
        const thumbnails: Thumbnail[] = []
        const mediaMap = new Map()
        media.forEach((m: any) => {
            mediaMap.set(m.media_key, m.url || m.preview_image_url)
        })

        const text = tweets
            .slice(0, 8)
            .map((tweet: any) => {
                const tweetText = tweet.text?.replace(/\n/g, ' ').slice(0, 300) || 'Tweet'
                const likes = tweet.public_metrics?.like_count || 0
                const retweets = tweet.public_metrics?.retweet_count || 0
                
                // Try grabbing photo
                if (tweet.attachments?.media_keys?.[0] && thumbnails.length < 5) {
                    const imgUrl = mediaMap.get(tweet.attachments.media_keys[0])
                    if (imgUrl) {
                        thumbnails.push({ title: tweetText.substring(0, 60), thumb: imgUrl, permalink: `https://twitter.com/${handle}/status/${tweet.id}`, score: likes })
                    }
                }
                
                return `• ${tweetText} [❤️ ${likes} | 🔄 ${retweets}]`
            })
            .join('\n')
            
        return { text, thumbnails }
    } catch (err) {
        console.error('[Twitter Fetch Error]', err)
        throw err
    }
}

async function fetchBluesky(url: string): Promise<FetchResult> {
    const match = url.match(/bsky\.app\/profile\/([^/?#]+)/)
    if (!match) throw new Error('Invalid Bluesky profile URL. Use format: bsky.app/profile/username')
    let handle = match[1]

    if (!handle.includes('.')) {
        handle += '.bsky.social'
    }

    try {
        const profileRes = await fetch(
            `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`,
            { signal: AbortSignal.timeout(10000) }
        )

        if (!profileRes.ok) throw new Error(`Bluesky handle "${handle}" not found`)
        const profile = await profileRes.json()
        const did = profile?.did
        if (!did) throw new Error('Could not find Bluesky user DID')

        const feedRes = await fetch(
            `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}&limit=10`,
            { signal: AbortSignal.timeout(10000) }
        )

        if (!feedRes.ok) throw new Error('Failed to fetch Bluesky posts')
        const feedData = await feedRes.json()
        const posts = feedData?.feed || []
        
        if (posts.length === 0) throw new Error('No posts found')

        const thumbnails: Thumbnail[] = []

        const text = posts
            .slice(0, 8)
            .map((item: any) => {
                const postText = item.post?.record?.text?.replace(/\n/g, ' ').slice(0, 300) || 'Post'
                const likes = item.post?.likeCount || 0
                const replies = item.post?.replyCount || 0
                
                // Get image
                const embed = item.post?.embed
                if (embed?.$type === 'app.bsky.embed.images#view' && embed.images?.length > 0 && thumbnails.length < 5) {
                    const imgUrl = embed.images[0].thumb
                    const uriParts = item.post.uri.split('/')
                    const postId = uriParts[uriParts.length - 1]
                    thumbnails.push({ title: postText.substring(0, 60), thumb: imgUrl, permalink: `https://bsky.app/profile/${handle}/post/${postId}`, score: likes })
                }
                
                return `• ${postText} [❤️ ${likes} | 💬 ${replies}]`
            })
            .join('\n')
            
        return { text, thumbnails }
    } catch (err) {
        console.error('[Bluesky Fetch Error]', err)
        throw err
    }
}

async function fetchTikTok(url: string): Promise<FetchResult> {
    const handleMatch = url.match(/tiktok\.com\/@([A-Za-z0-9_.]+)/)
    if (!handleMatch) throw new Error('Could not extract TikTok handle. Use format: tiktok.com/@username')
    const handle = handleMatch[1]
    // Try multiple public RSSHub instances — public ones often block Vercel IPs
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
            console.warn(`[TikTok] RSSHub instance ${base} failed:`, err)
            lastErr = err
        }
    }
    throw lastErr ?? new Error('All RSSHub instances failed for TikTok')
}

async function fetchHackerNews(url: string): Promise<FetchResult> {
    // Extract section from URL or default to top stories
    const sectionMatch = url.match(/news\.ycombinator\.com\/(top|new|best|ask|show|job)/)
    const section = sectionMatch ? sectionMatch[1] : 'top'

    try {
        const endpoint = section === 'top'
            ? 'https://hacker-news.firebaseio.com/v0/topstories.json'
            : section === 'new'
                ? 'https://hacker-news.firebaseio.com/v0/newstories.json'
                : section === 'best'
                    ? 'https://hacker-news.firebaseio.com/v0/beststories.json'
                    : section === 'ask'
                        ? 'https://hacker-news.firebaseio.com/v0/askstories.json'
                        : section === 'show'
                            ? 'https://hacker-news.firebaseio.com/v0/showstories.json'
                            : 'https://hacker-news.firebaseio.com/v0/jobstories.json'

        const idsRes = await fetch(endpoint, { signal: AbortSignal.timeout(10000) })
        if (!idsRes.ok) throw new Error('Failed to fetch HN story IDs')

        const storyIds = (await idsRes.json()).slice(0, 10)
        if (storyIds.length === 0) throw new Error('No stories found')

        const stories = await Promise.all(
            storyIds.slice(0, 8).map((id: number) =>
                fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) })
                    .then(r => r.json())
                    .catch(() => null)
            )
        )

        const validStories = stories.filter(Boolean)
        if (validStories.length === 0) throw new Error('Could not fetch story details')

        // HN doesn't really have thumbnails, just text
        const text = validStories
            .map(story => {
                const title = story.title?.slice(0, 150) || 'Story'
                const points = story.score || 0
                const comments = story.descendants || 0
                return `• ${title} [⬆️ ${points} points | 💬 ${comments}]`
            })
            .join('\n')
            
        return { text, thumbnails: [] }
    } catch (err) {
        console.error('[HN Fetch Error]', err)
        throw err
    }
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
        let fetchResult: FetchResult
        try {
            if (source.type === 'reddit') {
                fetchResult = await fetchReddit(source.url)
            } else if (source.type === 'youtube') {
                fetchResult = await fetchYouTube(source.url)
            } else if (source.type === 'twitter') {
                fetchResult = await fetchTwitter(source.url)
            } else if (source.type === 'bluesky') {
                fetchResult = await fetchBluesky(source.url)
            } else if (source.type === 'tiktok') {
                fetchResult = await fetchTikTok(source.url)
            } else if (source.type === 'hackernews') {
                fetchResult = await fetchHackerNews(source.url)
            } else {
                fetchResult = await fetchRSS(source.url)
            }
        } catch (fetchErr) {
            const msg = fetchErr instanceof Error ? fetchErr.message : 'Could not fetch content from source'
            console.error(`[fetch-source] Fetch failed for ${source.type} (${source.url}):`, fetchErr)
            return NextResponse.json({ error: msg }, { status: 422 })
        }

        const rawContent = fetchResult.text
        if (!rawContent) return NextResponse.json({ error: 'No content fetched from source' }, { status: 422 })

        // 1. Get user profile to check plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single()

        const userPlan = profile?.plan ?? 'free'
        console.log(`[Digest] User: ${user.id}, Plan: ${userPlan}`)

        // 2. Select appropriate Gemini API key
        const hasPaidKey = !!process.env.GOOGLE_GEMINI_API_KEY_PAID
        const hasFreeKey = !!process.env.GOOGLE_GEMINI_API_KEY_FREE

        const getValidKey = (k: string | undefined) => (k && k.startsWith('AIza') ? k : null)
        const paidKey = getValidKey(process.env.GOOGLE_GEMINI_API_KEY_PAID)
        const freeKey = getValidKey(process.env.GOOGLE_GEMINI_API_KEY_FREE)
        const defaultKey = getValidKey(process.env.GOOGLE_GEMINI_API_KEY)

        const apiKey = (userPlan === 'pro' || userPlan === 'ultra')
            ? (paidKey || defaultKey)
            : (freeKey || defaultKey)

        const isPaidUser = userPlan === 'pro' || userPlan === 'ultra'

        const debugKey = apiKey ? apiKey.substring(0, 10) + '...' : 'NONE'
        console.log(`[Digest Debug] Keys - Paid set: ${hasPaidKey}, Free set: ${hasFreeKey}, Using paid key: ${isPaidUser}, Final Key starts with: ${debugKey}`)

        // Generate digest with Gemini, fall back to rule-based if quota exceeded
        const freePrompt = `You are a concise content summarizer. Given the following recent posts/items from "${source.name}", write a tight digest of exactly 4–5 bullet points (use • character) in the SAME language as the content. Focus on the most interesting or important items. Be informative but brief. No intro sentence, just bullets.\n\nContent:\n${rawContent}`

        const paidPrompt = `You are an expert analyst and content curator. Analyze the following recent content from "${source.name}" and produce a rich, visually-structured intelligence digest.

STRICT FORMAT RULES — follow exactly:
1. Open with a bold section header using an emoji: **🔥 [Catchy descriptive title]:**
2. Write 5–7 bullet points, each starting with •
3. Begin each bullet with a contextual emoji: 📈 growth/metrics, 🚨 important news, 💡 insight, 🎯 key focus, 🎬 new content/launch, 📢 announcement, 🏆 achievement
4. Use **bold** around the most important words, names, numbers, or percentages in each bullet
5. If the content includes a direct URL, embed the most relevant one as [descriptive text](url) in the relevant bullet
6. Close with a styled takeaway: **💡 Takeaway:** [one compelling sentence synthesising the key message]

Write in the SAME language as the content. Use specific names, numbers, and dates. No intro sentences.

Content:
${rawContent}`

        const prompt = isPaidUser ? paidPrompt : freePrompt
        let digest: string
        let geminiUsed = true
        try {
            if (!apiKey) throw new Error('No Gemini API key available')
            digest = await geminiGenerate(prompt, apiKey, isPaidUser)
        } catch (err) {
            console.error('[Gemini Error] Full error:', err)
            geminiUsed = false
            digest = fallbackDigest(rawContent, source.name)
        }

        // --- Premium Feature: Extract Images for Paid Users ---
        let metadata = null
        if (isPaidUser && fetchResult.thumbnails.length > 0) {
            metadata = { thumbnails: fetchResult.thumbnails }
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
                metadata: metadata // New column!
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
