"use server"

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// Ensure the caller is an authenticated admin before allowing mutations
async function ensureAdmin() {
    // Cookie-based session must come from the regular server client
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) throw new Error('Authentication required')

    // Use admin client to bypass RLS for the role check
    const supabase = await createAdminClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') throw new Error('Unauthorized')
    return supabase
}

export async function updateStoreSettings(formData: FormData) {
    const supabase = await ensureAdmin()

    const name = formData.get('name') as string
    const tagline = formData.get('tagline') as string
    const currency = formData.get('currency') as string
    const storeEnabled = formData.get('storeEnabled') === 'on'

    // Update store info
    const { error: infoError } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'store_info',
            setting_value: { name, tagline, currency }
        })

    if (infoError) throw infoError

    // Update kill switch
    const { error: enabledError } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'store_enabled',
            setting_value: storeEnabled
        })

    if (enabledError) throw enabledError

    revalidatePath('/admin/settings')
    revalidatePath('/')
}
