import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockSupabaseClient } from './supabase/mock'

/**
 * 1️⃣ Server-Side Supabase Client (Next.js 15 compliant)
 * Uses the privileged SUPABASE_SERVICE_ROLE_KEY for administrative power.
 * Automatically handles cookies for authentication and RBAC.
 * Force-dynamic compatible.
 */
export async function createServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        // Fallback for build time safety
        console.warn("Missing Supabase environment variables on server. Returning mock client.");
        return createMockSupabaseClient();
    }

    const cookieStore = await cookies();

    return createSupabaseServerClient(
        supabaseUrl,
        serviceRoleKey,
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
