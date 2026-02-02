import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Public client for use in generateStaticParams or other contexts
 * where cookies/headers are not available or needed.
 */
export function createClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
