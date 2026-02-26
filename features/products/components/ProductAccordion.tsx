"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionItem {
    title: string
    content: React.ReactNode
}

interface ProductAccordionProps {
    items: AccordionItem[]
}

export function ProductAccordion({ items }: ProductAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <div className="w-full border-t border-charcoal/10 divide-y divide-charcoal/10">
            {items.map((item, index) => (
                <div key={index} className="py-2">
                    <button
                        onClick={() => toggle(index)}
                        className="flex w-full items-center justify-between py-4 text-left focus:outline-none group"
                    >
                        <h3 className="text-sm font-medium uppercase tracking-luxury text-charcoal group-hover:text-gold transition-colors">
                            {item.title}
                        </h3>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-textsoft transition-transform duration-300",
                                openIndex === index && "rotate-180 text-charcoal"
                            )}
                        />
                    </button>
                    <div
                        className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            openIndex === index ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"
                        )}
                    >
                        <div className="overflow-hidden">
                            <div className="text-sm text-textsoft leading-relaxed pr-4">
                                {item.content}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
