import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const isLocal = origin.includes('localhost')
            const forwardedHost = request.headers.get('x-forwarded-host')

            // If we have a forwarded host, use it for the redirect to stay on the same domain
            if (forwardedHost && !isLocal) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with some instructions
    return NextResponse.redirect(`${origin}/login?error=Authentication failed. Please try again.`)
}
