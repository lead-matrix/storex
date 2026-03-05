"use server"

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// Auth guard
// ─────────────────────────────────────────────────────────────────────────────
async function ensureAdmin() {
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) throw new Error('Authentication required')

    const supabase = await createAdminClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') throw new Error('Unauthorized')
    return supabase
}

// ─────────────────────────────────────────────────────────────────────────────
// Store / brand settings
// ─────────────────────────────────────────────────────────────────────────────
export async function updateStoreSettings(formData: FormData) {
    const supabase = await ensureAdmin()

    const name = formData.get('name') as string
    const tagline = formData.get('tagline') as string
    const currency = formData.get('currency') as string
    const storeEnabled = formData.get('storeEnabled') === 'on'

    const { error: infoError } = await supabase
        .from('site_settings')
        .upsert({ setting_key: 'store_info', setting_value: { name, tagline, currency } })

    if (infoError) throw infoError

    const { error: enabledError } = await supabase
        .from('site_settings')
        .upsert({ setting_key: 'store_enabled', setting_value: storeEnabled })

    if (enabledError) throw enabledError

    revalidatePath('/admin/settings')
    revalidatePath('/')
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero content
// ─────────────────────────────────────────────────────────────────────────────
export async function updateHeroContent(formData: FormData) {
    const supabase = await ensureAdmin()

    const title = formData.get('hero_title') as string
    const subtitle = formData.get('hero_subtitle') as string

    await supabase
        .from('frontend_content')
        .update({ content_data: { title, subtitle }, updated_at: new Date().toISOString() })
        .eq('content_key', 'hero_main')

    revalidatePath('/')
    revalidatePath('/admin/settings')
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation menus + social links  (single form submit)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateMenusAndSocials(formData: FormData) {
    const supabase = await ensureAdmin()

    const headerStr = formData.get('header_nav') as string
    const footerStr = formData.get('footer_legal') as string
    const instagram = (formData.get('instagram') as string) || ''
    const tiktok = (formData.get('tiktok') as string) || ''
    const facebook = (formData.get('facebook') as string) || ''

    if (headerStr) {
        try {
            await supabase
                .from('navigation_menus')
                .update({ menu_items: JSON.parse(headerStr), updated_at: new Date().toISOString() })
                .eq('menu_key', 'header_main')
        } catch { /* ignore JSON parse errors */ }
    }

    if (footerStr) {
        try {
            await supabase
                .from('navigation_menus')
                .update({ menu_items: JSON.parse(footerStr), updated_at: new Date().toISOString() })
                .eq('menu_key', 'footer_legal')
        } catch { /* ignore JSON parse errors */ }
    }

    await supabase
        .from('site_settings')
        .update({ setting_value: { instagram, tiktok, facebook }, updated_at: new Date().toISOString() })
        .eq('setting_key', 'social_media')

    revalidatePath('/', 'layout')
    revalidatePath('/admin/settings')
}
