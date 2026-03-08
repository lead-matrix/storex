import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import EmailSettingsEditor from './EmailSettingsEditor'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Email Design | Admin' }

export default async function AdminEmailPage() {
    const supabase = await createClient()

    // Fetch existing settings (may be null if not yet saved)
    const { data: row } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'email_settings')
        .single()

    const defaults = {
        brand_name: 'DINA COSMETIC',
        brand_tagline: 'The Obsidian Palace',
        accent_color: '#D4AF37',
        background_color: '#000000',
        text_color: '#ffffff',
        footer_note: 'This is an automated transmission from The Obsidian Palace.',
        // Order Confirmation
        confirm_subject: 'Your Ritual Has Begun — Order Confirmation',
        confirm_greeting: 'Salutations, {{name}}',
        confirm_body: 'Your selection has been registered at The Obsidian Palace. Our artisans are now preparing your artifacts for manifestation.',
        confirm_label: 'Order Confirmation',
        // Shipping Notification
        ship_subject: 'Artifacts Manifested — Your Order is En Route',
        ship_greeting: 'Your Artifacts are En Route, {{name}}',
        ship_body: 'Your selection has completed its preparation and has been dispatched from The Obsidian Palace.',
        ship_label: 'Shipping Manifest',
    }

    const saved = (row?.setting_value ?? {}) as Record<string, string>
    const settings = { ...defaults, ...saved }

    return <EmailSettingsEditor settings={settings} />
}
