/**
 * DINA COSMETIC — Route Proxy
 *
 * This is the single source of truth for session management and
 * route protection logic. There is NO middleware.ts — all guards
 * are enforced server-side in each route's layout or page.
 *
 * Auth pattern used across the app:
 *   - /admin/* → protected in app/admin/layout.tsx
 *   - /checkout/* → protected in app/checkout/layout.tsx
 *   - /login → bounces authenticated users to /
 *   - /maintenance → activated by site_settings.store_enabled = false
 *
 * This file exports re-usable server-side auth helpers that layouts call.
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/** Redirects to /login if no authenticated user exists. Returns the user. */
export async function requireAuth(redirectTo = '/login') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(redirectTo)
    return user
}

/** 
 * Redirects to / if the authenticated user is not an admin. Returns the profile.
 * Uses the admin client for the profile lookup to bypass RLS restrictions
 * that might prevent the anon client from reading profiles during auth checks.
 */
export async function requireAdmin() {
    // Use regular client just for auth session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Immediate bypass for the owner email (casing robust)
    const isAdminEmail = user.email?.toLowerCase() === 'admin@dinacosmetic.store'

    // Use admin client for the profile role lookup to bypass RLS
    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', user.id)
        .single()

    const isAdminRole = profile?.role === 'admin'

    // If NOT an admin email AND NOT an admin role, then kick them out
    if (!isAdminEmail && !isAdminRole) redirect('/')

    // For safety, construct a valid profile if one doesn't exist or misses the role
    const safeProfile = profile || {
        role: isAdminEmail ? 'admin' : 'customer',
        full_name: user?.user_metadata?.full_name || 'Admin',
        avatar_url: null,
    }

    // Force admin role in the object returned to the layout/components
    if (isAdminEmail) {
        safeProfile.role = 'admin'
    }

    return { user, profile: safeProfile }
}

/** Returns the current user or null — never throws. */
export async function getOptionalUser() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        return user
    } catch {
        return null
    }
}

/** Returns true if the store is active (store_enabled = true in site_settings). */
export async function isStoreEnabled(): Promise<boolean> {
    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'store_enabled')
            .single()
        return data?.setting_value !== false
    } catch {
        return true // fail open
    }
}

/** Default entry point for the Route Proxy mechanism. */
export default async function proxy() {
    return { success: true };
}

/** Named export as requested by certain build environments. */
export { proxy };

