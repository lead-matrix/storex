"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function NewsletterSection() {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setStatus("loading")
        // Simulate API call
        setTimeout(() => {
            setStatus("success")
            setEmail("")
        }, 1000)
    }

    return (
        <section className="section-padding bg-pearl border-t border-charcoal/5">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-heading tracking-luxury text-charcoal mb-4">
                    Join The Obsidian Palace
                </h2>
                <p className="text-sm tracking-luxury text-textsoft mb-8 max-w-lg leading-relaxed">
                    Subscribe to receive exclusive access to new collection launches, private events, and editorial content.
                </p>

                <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your Email Address"
                            disabled={status === "loading" || status === "success"}
                            className="w-full bg-transparent border-b border-charcoal/20 pb-2 pt-4 px-2 text-center text-sm text-charcoal outline-none placeholder:text-textsoft/50 focus:border-gold transition-colors uppercase tracking-luxury"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="luxury"
                        className="w-full mt-4 uppercase text-[10px] tracking-[0.2em]"
                        disabled={status === "loading" || status === "success"}
                    >
                        {status === "loading" ? "Subscribing..." :
                            status === "success" ? "Welcome to the Palace" :
                                "Subscribe"}
                    </Button>
                </form>
                {status === "success" && (
                    <p className="mt-4 text-xs tracking-luxury text-gold">Thank you for subscribing.</p>
                )}
            </div>
        </section>
    )
}
