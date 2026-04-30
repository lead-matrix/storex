// lib/utils/email.ts
// All email templates read design settings from Supabase so Dina can
// customise them visually from /admin/email without touching code.

import { createClient as createAdminClient } from '@/lib/supabase/admin'

interface OrderEmailProps {
    orderId: string
    customerEmail: string
    customerName: string
    totalAmount: number
    trackingNumber?: string
    labelUrl?: string
    items?: any[]
    recoveryLink?: string
}

const EMAIL_DEFAULTS = {
    brand_name: 'DINA COSMETIC',
    brand_tagline: 'The Obsidian Palace',
    accent_color: '#D4AF37',
    background_color: '#000000',
    text_color: '#ffffff',
    footer_note: 'This is an automated transmission from The Obsidian Palace.',
    confirm_subject: 'Your Ritual Has Begun — Order Confirmation',
    confirm_greeting: 'Salutations, {{name}}',
    confirm_body: 'Your selection has been registered at The Obsidian Palace. Our artisans are now preparing your artifacts for manifestation.',
    confirm_label: 'Order Confirmation',
    ship_subject: 'Artifacts Manifested — Your Order is En Route',
    ship_greeting: 'Your Artifacts are En Route, {{name}}',
    ship_body: 'Your selection has completed its preparation and has been dispatched from The Obsidian Palace.',
    ship_label: 'Shipping Manifest',
}

type EmailSettings = typeof EMAIL_DEFAULTS

async function getEmailSettings(): Promise<EmailSettings> {
    try {
        const supabase = await createAdminClient()
        const { data } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'email_settings')
            .single()

        if (data?.setting_value) {
            return { ...EMAIL_DEFAULTS, ...(data.setting_value as Partial<EmailSettings>) }
        }
    } catch {
        // Silently fall back to defaults if DB is unavailable
    }
    return EMAIL_DEFAULTS
}

function buildHtml(s: EmailSettings, body: string) {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background-color:#1a1a1a;">
<div style="padding:24px;">
<div style="max-width:600px;margin:0 auto;background-color:${s.background_color};color:${s.text_color};font-family:'Georgia',serif;border:1px solid ${s.accent_color}40;">
    <div style="text-align:center;padding:32px 40px;border-bottom:1px solid ${s.accent_color}30;">
        <h1 style="color:${s.accent_color};letter-spacing:6px;text-transform:uppercase;margin:0;font-size:20px;font-weight:400;">${s.brand_name}</h1>
        <p style="color:${s.accent_color}80;text-transform:uppercase;letter-spacing:3px;font-size:10px;margin:8px 0 0;">${s.brand_tagline}</p>
    </div>
    ${body}
    <div style="padding:20px 40px 32px;border-top:1px solid ${s.accent_color}20;text-align:center;">
        <p style="font-size:11px;color:${s.text_color}40;margin:0;">${s.footer_note}</p>
    </div>
</div>
</div>
</body>
</html>`
}

async function sendMail({ to, subject, html, fromName }: { to: string, subject: string, html: string, fromName: string }) {
    const envFrom = process.env.SMTP_FROM || 'orders@dinacosmetic.store';
    let finalFrom = envFrom;

    if (!envFrom.includes('<')) {
        finalFrom = `"${fromName}" <${envFrom}>`;
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
        try {
            const { Resend } = await import('resend')
            const resend = new Resend(resendApiKey)

            const { error } = await resend.emails.send({
                from: finalFrom,
                to,
                subject,
                html,
            })

            if (error) {
                console.error('[Email] Resend SDK error:', error);
                if (envFrom.includes('dinacosmetic.store')) {
                    console.warn('[Email] Retrying with Resend onboarding default address...');
                    await resend.emails.send({
                        from: `${fromName} <onboarding@resend.dev>`,
                        to,
                        subject,
                        html,
                    });
                }
            }
            return true
        } catch (error) {
            console.error('[Email] Resend SDK Exception:', error)
        }
    }

    console.warn('[Email] Critical: No email provider configured or all failed.')
    return false
}

export async function sendOrderConfirmationEmail({
    orderId,
    customerEmail,
    customerName,
    totalAmount,
    items = []
}: OrderEmailProps) {
    const s = await getEmailSettings()
    const greeting = s.confirm_greeting.replace('{{name}}', customerName)

    const itemsHtml = items.length > 0 ? `
    <div style="margin:20px 40px; border-bottom:1px solid ${s.accent_color}20; padding-bottom:10px;">
        ${items.map(item => `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px;">
                <span>${item.name || item.title || 'Artifact'} x ${item.quantity}</span>
                <span>$${parseFloat(item.price).toFixed(2)}</span>
            </div>
        `).join('')}
    </div>` : ''

    const body = `
    <div style="padding:24px 40px 0;">
        <p style="text-transform:uppercase;letter-spacing:3px;font-size:10px;color:${s.accent_color}80;margin:0;">${s.confirm_label}</p>
    </div>
    <div style="padding:20px 40px 10px;">
        <h2 style="font-weight:normal;font-size:20px;margin:0 0 16px;">${greeting}</h2>
        <p style="line-height:1.7;color:${s.text_color}cc;margin:0;">${s.confirm_body}</p>
    </div>
    ${itemsHtml}
    <div style="margin:0 40px 30px;background:${s.accent_color}10;border:1px solid ${s.accent_color}30;padding:20px;">
        <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Reference ID</p>
        <p style="margin:6px 0 16px;font-family:monospace;">${orderId}</p>
        <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Total Investment</p>
        <p style="margin:6px 0 0;font-size:18px;">$${totalAmount.toFixed(2)}</p>
    </div>`

    await sendMail({
        to: customerEmail,
        subject: s.confirm_subject,
        html: buildHtml(s, body),
        fromName: s.brand_name
    })
}

export async function sendShippingNotificationEmail({
    customerEmail,
    customerName,
    trackingNumber,
}: OrderEmailProps) {
    const s = await getEmailSettings()
    const greeting = s.ship_greeting.replace('{{name}}', customerName)

    const body = `
    <div style="padding:24px 40px 0;">
        <p style="text-transform:uppercase;letter-spacing:3px;font-size:10px;color:${s.accent_color}80;margin:0;">${s.ship_label}</p>
    </div>
    <div style="padding:20px 40px 30px;">
        <h2 style="font-weight:normal;font-size:20px;margin:0 0 16px;">${greeting}</h2>
        <p style="line-height:1.7;color:${s.text_color}cc;margin:0;">${s.ship_body}</p>
    </div>
    <div style="margin:0 40px 30px;background:${s.accent_color}10;border:1px solid ${s.accent_color}30;padding:20px;">
        <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
        <p style="margin:6px 0 0;font-family:monospace;font-size:18px;">${trackingNumber ?? 'N/A'}</p>
    </div>`

    await sendMail({
        to: customerEmail,
        subject: s.ship_subject,
        html: buildHtml(s, body),
        fromName: s.brand_name
    })
}

export async function sendDeliveryNotificationEmail({
    customerEmail,
    customerName,
    orderId,
}: OrderEmailProps) {
    const s = await getEmailSettings()
    const greeting = `Received in Full — ${customerName}`

    const body = `
    <div style="padding:24px 40px 0;">
        <p style="text-transform:uppercase;letter-spacing:3px;font-size:10px;color:${s.accent_color}80;margin:0;">Delivery Confirmed</p>
    </div>
    <div style="padding:20px 40px 30px;">
        <h2 style="font-weight:normal;font-size:20px;margin:0 0 16px;">${greeting}</h2>
        <p style="line-height:1.7;color:${s.text_color}cc;margin:0;">Your artifacts from The Obsidian Palace have reached their destination. We trust they meet your absolute requirements for excellence.</p>
    </div>
    <div style="margin:0 40px 30px;background:${s.accent_color}10;border:1px solid ${s.accent_color}30;padding:20px;">
        <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Reference ID</p>
        <p style="margin:6px 0 16px;font-family:monospace;font-size:18px;">${orderId}</p>
        <div style="margin-top:20px;text-align:center;">
            <p style="font-size:12px;margin-bottom:15px;color:${s.text_color}80;">Would you care to share your experience with these artifacts?</p>
            <a href="https://dinacosmetic.store/account/orders" style="display:inline-block;padding:12px 24px;background-color:${s.accent_color};color:#000;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">
                Leave a Review
            </a>
        </div>
    </div>`

    await sendMail({
        to: customerEmail,
        subject: `Artifacts Delivered — Order ${orderId.slice(0, 8)}`,
        html: buildHtml(s, body),
        fromName: s.brand_name
    })
}

export async function sendOutForDeliveryNotificationEmail({
    customerEmail,
    customerName,
    trackingNumber,
}: OrderEmailProps) {
    const s = await getEmailSettings()
    const greeting = `Immediate Manifestation — ${customerName}`

    const body = `
    <div style="padding:24px 40px 0;">
        <p style="text-transform:uppercase;letter-spacing:3px;font-size:10px;color:${s.accent_color}80;margin:0;">Out For Delivery</p>
    </div>
    <div style="padding:20px 40px 30px;">
        <h2 style="font-weight:normal;font-size:20px;margin:0 0 16px;">${greeting}</h2>
        <p style="line-height:1.7;color:${s.text_color}cc;margin:0;">Your artifacts have entered the final stage of arrival. They are currently out for delivery and will manifest at your destination shortly.</p>
    </div>
    <div style="margin:0 40px 30px;background:${s.accent_color}10;border:1px solid ${s.accent_color}30;padding:20px;">
        <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Tracking ID</p>
        <p style="margin:6px 0 0;font-family:monospace;font-size:18px;">${trackingNumber ?? 'N/A'}</p>
    </div>`

    await sendMail({
        to: customerEmail,
        subject: `Artifacts Incoming — Out For Delivery`,
        html: buildHtml(s, body),
        fromName: s.brand_name
    })
}

export async function sendAbandonedCartEmail({
    customerEmail,
    customerName,
    totalAmount,
    recoveryLink,
    items = []
}: OrderEmailProps) {
    const s = await getEmailSettings()

    const itemsHtml = items.length > 0 ? `
    <div style="margin:20px 40px; border-bottom:1px solid ${s.accent_color}20; padding-bottom:10px;">
        ${items.map(item => `
            <div style="font-size:12px; margin-bottom:8px;">
                <span>${item.name || item.title || 'Artifact'} x ${item.quantity}</span>
            </div>
        `).join('')}
    </div>` : ''

    const body = `
    <div style="padding:24px 40px 0;">
        <p style="text-transform:uppercase;letter-spacing:3px;font-size:10px;color:${s.accent_color}80;margin:0;">Unfinished Ritual</p>
    </div>
    <div style="padding:20px 40px 10px;">
        <h2 style="font-weight:normal;font-size:20px;margin:0 0 16px;">Your Selection Awaits, ${customerName}</h2>
        <p style="line-height:1.7;color:${s.text_color}cc;margin:0;">The Obsidian Palace remains open for you to finalize your selection before these artifacts are reclaimed by the collection.</p>
    </div>
    ${itemsHtml}
    <div style="padding:20px 40px 30px; text-align:center;">
        <a href="${recoveryLink}" style="background-color:${s.accent_color}; color:#000; padding:12px 24px; text-decoration:none; font-size:12px; text-transform:uppercase; letter-spacing:2px; display:inline-block; font-weight:bold;">
            Complete Your Order
        </a>
    </div>`

    await sendMail({
        to: customerEmail,
        subject: 'Your Dina Cosmetic Masterpiece Awaits',
        html: buildHtml(s, body),
        fromName: s.brand_name
    })
}

