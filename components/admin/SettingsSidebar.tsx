'use client'

import { Globe, Layout, Users, Truck, Monitor } from 'lucide-react'

const SECTIONS = [
    { label: 'General Info',      icon: Globe,    href: 'section-general'   },
    { label: 'Home Page',         icon: Monitor,  href: 'section-home'      },
    { label: 'Shipping Rates',    icon: Truck,    href: 'section-shipping'  },
    { label: 'Navigation & Social', icon: Layout, href: 'section-socials'   },
]


export function SettingsSidebar() {
    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 sticky top-24 self-start custom-scrollbar pb-2 lg:pb-0 whitespace-nowrap lg:whitespace-normal">
            {SECTIONS.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.href)}
                    className="flex-none lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 lg:px-6 py-3 lg:py-4 rounded-full lg:rounded-md transition-all bg-white/5 lg:bg-transparent text-white lg:text-luxury-subtext hover:text-white hover:bg-gold/10 lg:hover:bg-gold/5 border border-white/10 lg:border-transparent min-h-[44px]"
                >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[10px] uppercase tracking-luxury font-medium text-left">{item.label}</span>
                </button>
            ))}
        </div>
    )
}
