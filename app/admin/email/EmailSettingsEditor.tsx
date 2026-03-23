'use client'

import { useState, useTransition } from 'react'
import { Mail, Send, Eye, Truck, ShoppingBag, Palette, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { saveEmailSettings, sendTestEmail } from './actions'

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

function buildEmailPreviewHtml(s: EmailSettings, type: 'confirm' | 'ship') {
    const isConfirm = type === 'confirm'
    const greeting = isConfirm ? s.confirm_greeting.replace('{{name}}', 'Valued Client') : s.ship_greeting.replace('{{name}}', 'Valued Client')
    const body = isConfirm ? s.confirm_body : s.ship_body
    const label = isConfirm ? s.confirm_label : s.ship_label

    return `
    <div style="background-color:${s.background_color};color:${s.text_color};font-family:'Georgia',serif;padding:0;max-width:600px;width:100%;border:1px solid ${s.accent_color}40;font-size:14px;">
        <!-- Header -->
        <div style="text-align:center;padding:32px 40px;border-bottom:1px solid ${s.accent_color}30;">
            <h1 style="color:${s.accent_color};letter-spacing:6px;text-transform:uppercase;margin:0;font-size:20px;font-weight:400;">${s.brand_name}</h1>
            <p style="color:${s.accent_color}80;text-transform:uppercase;letter-spacing:3px;font-size:10px;margin:8px 0 0;">${s.brand_tagline}</p>
        </div>
        <!-- Type label -->
        <div style="padding:24px 40px 0;">
            <p style="text-transform:uppercase;letter-spacing:3px;font-size:10px;color:${s.accent_color}80;margin:0;">${label}</p>
        </div>
        <!-- Body -->
        <div style="padding:20px 40px 30px;">
            <h2 style="font-weight:normal;font-size:20px;margin:0 0 16px;">${greeting}</h2>
            <p style="line-height:1.7;color:${s.text_color}cc;margin:0;">${body}</p>
        </div>
        <!-- Info block -->
        <div style="margin:0 40px 30px;background:${s.accent_color}10;border:1px solid ${s.accent_color}30;padding:20px;">
            ${isConfirm ? `
            <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Reference ID</p>
            <p style="margin:6px 0 16px;font-family:monospace;font-size:13px;">ORD-PREVIEW-001</p>
            <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Total Investment</p>
            <p style="margin:6px 0 0;font-size:18px;">$149.00</p>
            ` : `
            <p style="margin:0;font-size:10px;color:${s.accent_color};text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
            <p style="margin:6px 0 0;font-family:monospace;font-size:18px;">9261290100830090089802</p>
            `}
        </div>
        <!-- Footer -->
        <div style="padding:0 40px 32px;border-top:1px solid ${s.accent_color}20;padding-top:20px;text-align:center;">
            <p style="font-size:11px;color:${s.text_color}40;margin:0;">${s.footer_note}</p>
        </div>
    </div>
    `
}

export default function EmailSettingsEditor({ settings: initial }: { settings: EmailSettings }) {
    const [settings, setSettings] = useState<EmailSettings>(initial)
    const [preview, setPreview] = useState<'confirm' | 'ship'>('confirm')
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [testEmail, setTestEmail] = useState('')
    const [testSending, setTestSending] = useState(false)

    const set = (key: keyof EmailSettings, val: string) =>
        setSettings(prev => ({ ...prev, [key]: val }))

    const handleSave = () => {
        setStatus(null)
        startTransition(async () => {
            const res = await saveEmailSettings(settings)
            setStatus(res.success
                ? { type: 'success', msg: 'Email design saved. Future emails will use these settings.' }
                : { type: 'error', msg: res.error ?? 'Save failed.' }
            )
        })
    }

    const handleTestSend = async () => {
        if (!testEmail) return
        setTestSending(true)
        setStatus(null)
        const res = await sendTestEmail(testEmail, settings)
        setTestSending(false)
        setStatus(res.success
            ? { type: 'success', msg: `Test email sent to ${testEmail}!` }
            : { type: 'error', msg: res.error ?? 'Send failed.' }
        )
    }

    const FIELD_CLASS = 'w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-white/40'
    const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wide text-luxury-subtext mb-1.5'

    return (
        <div className="space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-white tracking-tight">Email Design Studio</h1>
                    <p className="text-xs uppercase tracking-widest text-white/40 mt-1 font-medium">Visual Email Template Editor</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Save Design
                    </button>
                </div>
            </div>

            {/* Status Banner */}
            {status && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {status.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {status.msg}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* ── LEFT: Controls Panel */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Brand Identity */}
                    <div className="bg-[#121214] border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4 text-white/40" />
                            <h2 className="text-sm font-bold uppercase tracking-wide text-white">Brand Identity</h2>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Brand Name</label>
                            <input className={FIELD_CLASS} value={settings.brand_name} onChange={e => set('brand_name', e.target.value)} placeholder="DINA COSMETIC" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Tagline</label>
                            <input className={FIELD_CLASS} value={settings.brand_tagline} onChange={e => set('brand_tagline', e.target.value)} placeholder="Premium Beauty & Skincare" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className={LABEL_CLASS}>Accent</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={settings.accent_color} onChange={e => set('accent_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer p-0.5" />
                                    <input className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono" value={settings.accent_color} onChange={e => set('accent_color', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Background</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={settings.background_color} onChange={e => set('background_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer p-0.5" />
                                    <input className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono" value={settings.background_color} onChange={e => set('background_color', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Text</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={settings.text_color} onChange={e => set('text_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer p-0.5" />
                                    <input className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono" value={settings.text_color} onChange={e => set('text_color', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Footer Note</label>
                            <input className={FIELD_CLASS} value={settings.footer_note} onChange={e => set('footer_note', e.target.value)} />
                        </div>
                    </div>

                    {/* Order Confirmation Template */}
                    <div className="bg-[#121214] border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingBag className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wide text-white">Order Confirmation Email</h2>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Subject Line</label>
                            <input className={FIELD_CLASS} value={settings.confirm_subject} onChange={e => set('confirm_subject', e.target.value)} />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Section Label</label>
                            <input className={FIELD_CLASS} value={settings.confirm_label} onChange={e => set('confirm_label', e.target.value)} placeholder="Order Confirmation" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Greeting <span className="normal-case text-white/40 font-normal">— use {"{{name}}"} for customer name</span></label>
                            <input className={FIELD_CLASS} value={settings.confirm_greeting} onChange={e => set('confirm_greeting', e.target.value)} placeholder="Hello, {{name}}" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Body Text</label>
                            <textarea className={`${FIELD_CLASS} min-h-[80px] resize-none`} value={settings.confirm_body} onChange={e => set('confirm_body', e.target.value)} />
                        </div>
                        <button onClick={() => setPreview('confirm')} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${preview === 'confirm' ? 'bg-white text-black' : 'bg-white/5 text-luxury-subtext hover:bg-white/10'}`}>
                            <Eye className="w-3 h-3 inline mr-1.5" />Preview this template
                        </button>
                    </div>

                    {/* Shipping Notification Template */}
                    <div className="bg-[#121214] border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-purple-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wide text-white">Shipping Notification Email</h2>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Subject Line</label>
                            <input className={FIELD_CLASS} value={settings.ship_subject} onChange={e => set('ship_subject', e.target.value)} />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Section Label</label>
                            <input className={FIELD_CLASS} value={settings.ship_label} onChange={e => set('ship_label', e.target.value)} placeholder="Shipping Manifest" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Greeting <span className="normal-case text-white/40 font-normal">— use {"{{name}}"} for customer name</span></label>
                            <input className={FIELD_CLASS} value={settings.ship_greeting} onChange={e => set('ship_greeting', e.target.value)} placeholder="Your order has shipped, {{name}}" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Body Text</label>
                            <textarea className={`${FIELD_CLASS} min-h-[80px] resize-none`} value={settings.ship_body} onChange={e => set('ship_body', e.target.value)} />
                        </div>
                        <button onClick={() => setPreview('ship')} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${preview === 'ship' ? 'bg-white text-black' : 'bg-white/5 text-luxury-subtext hover:bg-white/10'}`}>
                            <Eye className="w-3 h-3 inline mr-1.5" />Preview this template
                        </button>
                    </div>

                    {/* Send Test Email */}
                    <div className="bg-[#121214] border border-white/10 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Send className="w-4 h-4 text-blue-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wide text-white">Send Test Email</h2>
                        </div>
                        <p className="text-xs text-luxury-subtext mb-4">Fire a live test with the current settings to any inbox.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                                className={`${FIELD_CLASS} flex-1`}
                            />
                            <button
                                onClick={handleTestSend}
                                disabled={testSending || !testEmail}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 shrink-0"
                            >
                                {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                            </button>
                        </div>
                        <p className="text-[10px] text-white/40 mt-2">Will send the currently previewed template type: <strong>{preview === 'confirm' ? 'Order Confirmation' : 'Shipping Notification'}</strong>.</p>
                    </div>
                </div>

                {/* ── RIGHT: Live Preview */}
                <div className="xl:col-span-3">
                    <div className="sticky top-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-4 h-4 text-white/40" />
                            <span className="text-sm font-semibold text-white uppercase tracking-wide">Live Preview</span>
                            <span className="ml-auto text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded font-medium">
                                {preview === 'confirm' ? 'Order Confirmation' : 'Shipping Notification'}
                            </span>
                        </div>

                        {/* Email client chrome mockup */}
                        <div className="bg-white/5 rounded-2xl shadow-xl overflow-hidden border border-white/10">
                            {/* Simulated email header */}
                            <div className="bg-[#121214] border-b border-white/10 px-6 py-4">
                                <p className="text-xs text-luxury-subtext">
                                    <span className="font-semibold text-white">From: </span>{settings.brand_name} &lt;orders@updates.dinacosmetic.com&gt;
                                </p>
                                <p className="text-xs text-luxury-subtext mt-1">
                                    <span className="font-semibold text-white">Subject: </span>
                                    {preview === 'confirm' ? settings.confirm_subject : settings.ship_subject}
                                </p>
                            </div>
                            {/* Email body rendered live */}
                            <div className="p-4 bg-black/50 overflow-auto max-h-[700px]">
                                <div
                                    className="mx-auto"
                                    style={{ maxWidth: 600 }}
                                    dangerouslySetInnerHTML={{ __html: buildEmailPreviewHtml(settings, preview) }}
                                />
                            </div>
                        </div>

                        <p className="text-[10px] text-white/40 text-center mt-3">
                            ✦ All changes update the preview instantly. Click "Save Design" to make them live.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
