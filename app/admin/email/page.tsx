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
        brand_tagline: 'Premium Beauty & Skincare',
        accent_color: '#D4AF37',
        background_color: '#000000',
        text_color: '#ffffff',
        footer_note: 'This is an automated transmission from Dina Cosmetic.',
        // Order Confirmation
        confirm_subject: 'Order Confirmed - Thank You',
        confirm_greeting: 'Hello, {{name}}',
        confirm_body: 'Your order has been received at Dina Cosmetic. We are now preparing your products for shipment.',
        confirm_label: 'Order Confirmation',
        // Shipping Notification
        ship_subject: 'Your Order is En Route',
        ship_greeting: 'Your order has shipped, {{name}}',
        ship_body: 'Your products have completed their preparation and have been dispatched from Dina Cosmetic.',
        ship_label: 'Shipping Confirmation',
    }

    const saved = (row?.setting_value ?? {}) as Record<string, string>
    const settings = { ...defaults, ...saved }

    return <EmailSettingsEditor settings={settings} />
}
