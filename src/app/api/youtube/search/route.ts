import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchChannels } from '@/lib/api/youtube'

/**
 * GET /api/youtube/search?q=mkbhd&max=5
 * 
 * Search YouTube channels by keyword.
 * Returns basic info for the search UI.
 * 
 * Quota cost: 100 units (search) + 1 unit (channel details) = 101 units
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const max = parseInt(searchParams.get('max') ?? '5', 10)

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
    }

    const results = await searchChannels(query, Math.min(max, 10))

    return NextResponse.json({ results })

  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
