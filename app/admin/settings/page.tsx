"use client";

import { supabase } from "@/lib/supabase-client";
import { Settings as SettingsIcon, Globe, CreditCard, Bell, ShieldCheck } from "lucide-react";

export default function AdminSettings() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-3xl font-serif text-gold mb-1">Palace Orchestration</h2>
                <p className="text-zinc-500 text-sm tracking-widest uppercase">Global configuration for your luxury empire</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Store Config */}
                <SettingsSection
                    title="Store Identity"
                    icon={<Globe className="text-gold" size={18} />}
                    description="General information and localization."
                >
                    <div className="space-y-4 pt-4">
                        <SettingField label="Store Name" value="DINA COSMETIC" />
                        <SettingField label="Support Email" value="concierge@dinacosmetic.store" />
                        <SettingField label="Base Currency" value="USD ($)" />
                    </div>
                </SettingsSection>

                {/* Integration Status */}
                <SettingsSection
                    title="The Core (API Status)"
                    icon={<ShieldCheck className="text-emerald-500" size={18} />}
                    description="Real-time connectivity status."
                >
                    <div className="space-y-4 pt-4">
                        <StatusIndicator label="Stripe Production" active={false} />
                        <StatusIndicator label="Resend Mailer" active={true} />
                        <StatusIndicator label="Shippo Logistics" active={true} />
                    </div>
                </SettingsSection>

                {/* Payment Logic */}
                <SettingsSection
                    title="Financial Logic"
                    icon={<CreditCard className="text-gold" size={18} />}
                    description="Configure taxes and shipping rules."
                >
                    <div className="space-y-4 pt-4">
                        <SettingField label="VAT / Sales Tax" value="8.0%" />
                        <SettingField label="Free Shipping Threshold" value="$75.00" />
                        <SettingField label="Standard Shipping" value="$10.00" />
                    </div>
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection
                    title="Communication"
                    icon={<Bell className="text-gold" size={18} />}
                    description="Automated client engagement."
                >
                    <div className="space-y-4 pt-4">
                        <ToggleSetting label="Order Confirmation Emails" enabled={true} />
                        <ToggleSetting label="Shipping Updates" enabled={true} />
                        <ToggleSetting label="Inventory Alerts" enabled={false} />
                    </div>
                </SettingsSection>
            </div>
        </div>
    );
}

function SettingsSection({ title, icon, description, children }: { title: string; icon: React.ReactNode; description: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-950 border border-gold/10 p-8 hover:border-gold/30 transition-all shadow-xl">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-zinc-900 border border-gold/5">{icon}</div>
                <div>
                    <h3 className="text-lg font-serif text-white">{title}</h3>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function SettingField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gold/5 group">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
            <span className="text-sm font-sans text-white">{value}</span>
        </div>
    );
}

function StatusIndicator({ label, active }: { label: string; active: boolean }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gold/5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                <span className={`text-[9px] uppercase tracking-widest ${active ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {active ? 'Synchronized' : 'Pending Config'}
                </span>
            </div>
        </div>
    );
}

function ToggleSetting({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gold/5 group">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
            <div className={`w-10 h-5 border ${enabled ? 'border-gold/50 bg-gold/10' : 'border-zinc-800 bg-zinc-900'} relative cursor-pointer flex items-center px-1`}>
                <div className={`w-3 h-3 ${enabled ? 'bg-gold ml-auto' : 'bg-zinc-700'}`} />
            </div>
        </div>
    );
}
