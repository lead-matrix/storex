import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * PROXY LAYER: Handles request-scoped cookie interactions and 
 * role-based access control for The Obsidian Palace.
 */
export default async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers }
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return request.cookies.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // We refresh the session without crashing if no user is found
    const { data: { user } } = await supabase.auth.getUser()

    // LOCK DOWN ADMIN: Only check for roles if we are actually on an admin path
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return response
}

// Ensure the matcher targets specifically needed luxury routes
export const config = {
    matcher: ['/shop/:path*', '/admin/:path*', '/checkout/:path*'],
};
