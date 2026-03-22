import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Gemini ───────────────────────────────────────────────────────────────────

async function geminiGenerate(prompt: string, apiKey: string): Promise<string> {
    const models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
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
        if (res.status === 404) { lastError = `${model} not found`; continue }
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

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(subjectNames: string[]): string {
    const subjectContext = subjectNames.length > 0
        ? `The creator tracks these niches in Stalkai: **${subjectNames.join(', ')}**.`
        : 'The creator has not set up any tracked niches yet.'

    return `You are an Offer Architect specializing in helping content creators monetize their expertise. Your goal is to guide the creator through a structured 6-stage interview to discover their ideal high-ticket digital offer (course, coaching program, community, or digital product).

${subjectContext}

CRITICAL RULES:
- Ask ONE question at a time. Never ask multiple questions in one message.
- Be conversational and warm, not clinical or corporate.
- Reference their tracked niches when relevant to make questions specific to their world.
- After 2-3 meaningful exchanges within a stage, when you have enough information to move forward, signal readiness to advance by appending the exact token [ADVANCE_STAGE] at the very end of your response (after your message, on its own line).
- When Stage 6 is complete and you have generated the full blueprint, append [BLUEPRINT_START] on its own line, followed immediately by the formatted blueprint.
- Do NOT include [ADVANCE_STAGE] and [BLUEPRINT_START] in the same response.
- Keep responses concise and focused. No walls of text.

THE 6 STAGES:

Stage 1 — Background Discovery
Ask about their content journey: how long they've been creating, what they cover, their biggest challenge they've overcome as a creator, and what unique perspective they have that others in their niche don't.

Stage 2 — Skill Extraction
Identify what they can monetize. Ask what transformation or result they consistently create for their audience. What do viewers message them about most? What can they confidently teach or guide someone to do?

Stage 3 — Market Alignment
Find the paying student. Ask who specifically would benefit most from their expertise. What problem are they solving? What would someone pay to get that transformation faster?

Stage 4 — Offer Architecture
Design the offer format. Ask whether they prefer coaching (1:1 or group), a self-paced course, a live cohort, a community, or a digital product (templates, guides). What duration makes sense? What does the delivery look like?

Stage 5 — High-Ticket Validation
Justify a $1,000–$10,000 price point. Ask about the measurable outcome their student achieves. What's the cost of NOT solving this problem? What ROI can their student expect?

Stage 6 — Positioning & Messaging
Craft the hook. Ask what makes their offer different from free YouTube content. What's the unique angle only THEY can offer? Help them articulate a core promise and a launch message.

BLUEPRINT FORMAT (emit ONLY after Stage 6, preceded by [BLUEPRINT_START] on its own line):

**CONTENT BUSINESS BLUEPRINT**

**Your Offer:** [one compelling sentence describing the offer]

**Target Student:** [who they are and what they desperately want]

**Core Transformation:** [what specifically changes for them]

**Format & Structure:** [type of offer + how it's delivered + duration]

**Price Point:** [$X — specific justification based on transformation and ROI]

**Your Unique Hook:** [what makes this different from anything else out there]

**Launch Message:** [3 sentences the creator can use on their channel to announce this offer]`
}

// ── Route ─────────────────────────────────────────────────────────────────────

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export async function POST(req: NextRequest) {
    try {
        const { messages, stage, subjects, action, blueprint } = await req.json()

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profileData } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        const plan = profileData?.plan ?? 'free'

        if (plan === 'free') {
            return NextResponse.json({ error: 'Upgrade to Pro or Ultra to use Offer Builder.' }, { status: 403 })
        }

        // Save action — persist blueprint to digests table
        if (action === 'save' && blueprint) {
            const { error: saveErr } = await supabase.from('digests').insert({
                user_id: user.id,
                subject_id: null,
                source_id: null,
                source_name: 'Offer Builder Blueprint',
                source_type: 'offer_blueprint',
                content: blueprint,
            })
            if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        const apiKey = process.env.GOOGLE_GEMINI_API_KEY_PAID
            || process.env.GOOGLE_GEMINI_API_KEY
            || process.env.GOOGLE_GEMINI_API_KEY_FREE

        if (!apiKey) return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 })

        const subjectNames: string[] = Array.isArray(subjects) ? subjects : []
        const systemPrompt = buildSystemPrompt(subjectNames)

        // Flatten conversation history into prompt
        const conversationHistory = (messages as Message[])
            .map(m => `${m.role === 'user' ? 'Creator' : 'Coach'}: ${m.content}`)
            .join('\n\n')

        const prompt = `${systemPrompt}

--- CONVERSATION SO FAR ---
${conversationHistory || '(No conversation yet — this is the very start.)'}

--- YOUR NEXT RESPONSE (Stage ${stage || 1}) ---
Coach:`

        const raw = await geminiGenerate(prompt, apiKey)

        // Parse control tokens
        let reply = raw.trim()
        let nextStage: number | undefined
        let blueprintResult: string | undefined

        if (reply.includes('[BLUEPRINT_START]')) {
            const parts = reply.split('[BLUEPRINT_START]')
            reply = parts[0].trim()
            blueprintResult = parts[1]?.trim()
        } else if (reply.includes('[ADVANCE_STAGE]')) {
            reply = reply.replace('[ADVANCE_STAGE]', '').trim()
            const currentStage = typeof stage === 'number' ? stage : 1
            nextStage = Math.min(currentStage + 1, 6)
        }

        // Clean up any stray token remnants
        reply = reply.replace(/\[ADVANCE_STAGE\]/g, '').replace(/\[BLUEPRINT_START\]/g, '').trim()

        return NextResponse.json({ reply, nextStage, blueprint: blueprintResult })
    } catch (err: unknown) {
        console.error('[offer-builder]', err)
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
    }
}
