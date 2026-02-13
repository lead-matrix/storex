import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Public client for use in generateStaticParams or other contexts
 * where cookies/headers are not available or needed.
 */
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Log a warning instead of throwing during build if variables are missing
        console.warn("Supabase environment variables are missing. This is expected during some build phases if they aren't provided.");
        return null;
    }

    return createSupabaseClient(
        supabaseUrl,
        supabaseKey
    )
}
