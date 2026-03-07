import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const isSupabaseConfigured = SUPABASE_URL.startsWith('http') && !SUPABASE_URL.includes('placeholder') && !SUPABASE_KEY.includes('placeholder')

export async function middleware(request: NextRequest) {
    // If Supabase is not configured yet, allow all requests through
    if (!isSupabaseConfigured) return NextResponse.next({ request })

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const protectedPaths = ['/dashboard', '/settings']
    const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))
    const isAuth = ['/login', '/signup'].includes(request.nextUrl.pathname)

    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (isAuth && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
