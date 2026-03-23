'use client'

import { Globe, Layout, Users, Truck } from 'lucide-react'

const SECTIONS = [
    { label: 'General Info',    icon: Globe,   href: 'section-general'  },
    { label: 'Shipping Rates',  icon: Truck,   href: 'section-shipping' },
    { label: 'Visual Storefront', icon: Layout, href: 'section-socials' },
    { label: 'Socials',         icon: Users,   href: 'section-socials'  },
]

export function SettingsSidebar() {
    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="lg:col-span-1 space-y-2 sticky top-24 self-start">
            {SECTIONS.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.href)}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-md transition-all bg-transparent text-luxury-subtext hover:text-white hover:bg-gold/5 hover:border-gold/20 border border-transparent"
                >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[10px] uppercase tracking-luxury font-medium text-left">{item.label}</span>
                </button>
            ))}
        </div>
    )
}
