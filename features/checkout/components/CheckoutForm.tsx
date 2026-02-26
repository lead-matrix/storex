"use client"

import { useState } from "react"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
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
        })

        if (error) {
            setErr(error.message ?? "Payment failed.")
            setBusy(false)
        } else {
            onSuccess()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-luxury shadow-soft border border-charcoal/5">
            <div className="mb-6">
                <h2 className="text-sm font-heading uppercase tracking-luxury text-charcoal mb-4 font-medium">
                    Payment Details
                </h2>
                <div className="w-12 h-px bg-gold/50 mb-6" />
            </div>

            <PaymentElement options={{ layout: "tabs", paymentMethodOrder: ["card"] }} />

            {err && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-100 text-xs tracking-luxury uppercase">
                    {err}
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || busy}
                variant="luxury"
                className="w-full h-14 bg-charcoal text-white hover:bg-gold hover:text-white mt-8"
            >
                {busy ? (
                    "Processing..."
                ) : (
                    <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Complete Secure Purchase
                    </span>
                )}
            </Button>

            <p className="text-center text-[10px] uppercase tracking-luxury text-textsoft pt-4">
                Secured by Stripe · 256-bit SSL Encryption
            </p>
        </form>
    )
}
