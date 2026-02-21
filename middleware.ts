import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * LMXEngine Middleware
 * Unified security and session management layer.
 */
export default async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Using getUser() is the secure way to check auth, but we handle the specific "refresh_token_not_found" error.
    const { data: { user }, error } = await supabase.auth.getUser()

    // 1. Handle Refresh Token Error / Missing Session
    if (error && error.code === 'refresh_token_not_found') {
        // Clear cookies and bounce to login if trying to access protected routes
        const isProtected = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/checkout');
        if (isProtected) {
            const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
            // Attempt to clear session cookies
            redirectResponse.cookies.delete('sb-access-token')
            redirectResponse.cookies.delete('sb-refresh-token')
            return redirectResponse
        }
    }

    // 2. Admin Portal Protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // 3. Checkout Flow Protection
    if (request.nextUrl.pathname.startsWith('/checkout')) {
        if (!user) {
            return NextResponse.redirect(new URL(`/login?next=${request.nextUrl.pathname}`, request.url))
        }
    }

    // 4. Login Redirect Logic
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 5. Kill Switch (Store Enabled Check)
    if (!request.nextUrl.pathname.startsWith('/admin') &&
        !request.nextUrl.pathname.startsWith('/api') &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/_next') &&
        !request.nextUrl.pathname.startsWith('/maintenance')) {

        // Use service role or public check for settings? 
        // profiles RLS is based on is_admin(), so for public we need to ensure site_settings is public.
        const { data: settings } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'store_enabled')
            .single();

        if (settings && settings.setting_value === false) {
            return NextResponse.redirect(new URL('/maintenance', request.url));
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/webhooks (Stripe needs public access)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
