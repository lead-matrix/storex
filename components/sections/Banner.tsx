import React from 'react'

export interface BannerProps {
    text?: string
    backgroundColor?: string
    textColor?: string
}

export default function Banner({ text, backgroundColor = "#18181b", textColor = "#FFFFFF" }: BannerProps) {
    return (
        <div
            className="w-full py-4 text-center px-4"
            style={{ backgroundColor, color: textColor }}
        >
            <p className="text-sm uppercase tracking-widest font-medium">
                {text || "Promotional Banner Text"}
            </p>
        </div>
    )
}
