"use client"

import { useState } from "react"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Lock } from "lucide-react"

interface CheckoutFormProps {
    onSuccess: () => void
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements) return

        setBusy(true)
        setErr(null)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/checkout/success` },
            redirect: "if_required"
        })

        if (error) {
            setErr(error.message ?? "Payment failed.")
            setBusy(false)
        } else {
            onSuccess()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
            <div className="mb-8">
                <h2 className="text-xl font-serif uppercase tracking-widest text-white mb-4">
                    Secure Passage
                </h2>
                <div className="w-16 h-px bg-gold/50" />
            </div>

            <PaymentElement options={{ layout: "tabs", paymentMethodOrder: ["card"] }} />

            {err && (
                <div className="bg-red-950/50 text-red-400 p-4 rounded-lg border border-red-500/20 text-[10px] tracking-widest uppercase">
                    {err}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || busy}
                className="w-full h-14 bg-[#C6A75E] text-black hover:bg-[#D4AF37] hover:shadow-[0_0_20px_rgba(198,167,94,0.3)] transition-all duration-300 font-medium uppercase tracking-[0.2em] text-xs flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-10"
            >
                {busy ? (
                    <span className="animate-pulse">Authorizing...</span>
                ) : (
                    <span className="flex items-center gap-3">
                        <Lock size={14} strokeWidth={2} />
                        Confirm Acquisition
                    </span>
                )}
            </button>

            <div className="pt-6 border-t border-white/5 flex flex-col items-center">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 text-center">
                    Secured by Stripe <br className="md:hidden" />
                    <span className="hidden md:inline">·</span> 256-bit SSL Encryption
                </p>
            </div>
        </form>
    )
}
