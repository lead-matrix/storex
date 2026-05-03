
'use client'
import { DividerProps } from '@/lib/builder/types'

export default function DividerSection({ style }: DividerProps) {
    if (style === 'line') return <div className="py-4 px-8"><div className="border-t border-white/10" /></div>
    if (style === 'dots') return <div className="py-6 flex justify-center gap-3"><span className="w-1 h-1 rounded-full bg-[#D4AF37]" /><span className="w-1 h-1 rounded-full bg-[#D4AF37]" /><span className="w-1 h-1 rounded-full bg-[#D4AF37]" /></div>
    return <div className="py-8 flex justify-center"><span className="text-[#D4AF37] text-lg tracking-[0.5em]">✦ ✦ ✦</span></div>
}
