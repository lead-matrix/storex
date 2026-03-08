'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface EmailSettings {
    brand_name: string
    brand_tagline: string
    accent_color: string
    background_color: string
    text_color: string
    footer_note: string
    confirm_subject: string
    confirm_greeting: string
    confirm_body: string
    confirm_label: string
    ship_subject: string
    ship_greeting: string
    ship_body: string
    ship_label: string
}

export async function saveEmailSettings(settings: EmailSettings): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('site_settings')
        .upsert(
            { setting_key: 'email_settings', setting_value: settings },
            { onConflict: 'setting_key' }
        )

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/email')
    return { success: true }
}

export async function sendTestEmail(toEmail: string, settings: EmailSettings): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return { success: false, error: 'RESEND_API_KEY not configured.' }

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(apiKey)

        const greeting = settings.confirm_greeting.replace('{{name}}', 'Valued Client')

        const html = `
        <div style="background-color:${settings.background_color};color:${settings.text_color};font-family:'Georgia',serif;padding:0;max-width:600px;width:100%;border:1px solid ${settings.accent_color}40;font-size:14px;">
            <div style="text-align:center;padding:32px 40px;border-bottom:1px solid ${settings.accent_color}30;">
                <h1 style="color:${settings.accent_color};letter-spacing:6px;text-transform:uppercase;margin:0;font-size:20px;font-weight:400;">${settings.brand_name}</h1>
                <p style="color:${settings.accent_color}80;text-transform:uppercase;letter-spacing:3px;font-size:10px;margin:8px 0 0;">${settings.brand_tagline}</p>
            </div>
            <div style="padding:24px 40px 0;">
                <p style="text-transform:uppercase;letter-spacing:3px;font-size:10px;color:${settings.accent_color}80;margin:0;">${settings.confirm_label}</p>
            </div>
            <div style="padding:20px 40px 30px;">
                <h2 style="font-weight:normal;font-size:20px;margin:0 0 16px;">${greeting}</h2>
                <p style="line-height:1.7;color:${settings.text_color}cc;margin:0;">${settings.confirm_body}</p>
            </div>
            <div style="margin:0 40px 30px;background:${settings.accent_color}10;border:1px solid ${settings.accent_color}30;padding:20px;">
                <p style="margin:0;font-size:10px;color:${settings.accent_color};text-transform:uppercase;letter-spacing:1px;">Reference ID</p>
                <p style="margin:6px 0 16px;font-family:monospace;font-size:13px;">TEST-EMAIL-PREVIEW</p>
                <p style="margin:0;font-size:10px;color:${settings.accent_color};text-transform:uppercase;letter-spacing:1px;">Total Investment</p>
                <p style="margin:6px 0 0;font-size:18px;">$149.00</p>
            </div>
            <div style="padding:20px 40px 32px;border-top:1px solid ${settings.accent_color}20;text-align:center;">
                <p style="font-size:11px;color:${settings.text_color}40;margin:0;">${settings.footer_note}</p>
            </div>
        </div>
        `

        await resend.emails.send({
            from: `${settings.brand_name} <onboarding@resend.dev>`,
            to: toEmail,
            subject: `[TEST] ${settings.confirm_subject}`,
            html,
        })

        return { success: true }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return { success: false, error: message }
    }
}
