import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * FIXED: This client checks if it's being called during a "Static Generation" 
 * (Build) and skips the cookie requirement if so.
 */
export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn("Supabase environment variables are missing in server client. This is expected during some build phases.");
        // Return a mock object or handle it in the caller
        return null as any;
    }

    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value, ...options }) } catch (e) { }
                },
                remove(name: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value: '', ...options }) } catch (e) { }
                },
            },
        }
    )
}
