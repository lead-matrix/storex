"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Lock } from "lucide-react";
import { motion } from "framer-motion";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STRIPE_APPEARANCE: NonNullable<Parameters<typeof Elements>[0]["options"]>["appearance"] = {
    theme: "night",
    variables: {
        colorPrimary: "#D4AF37",
        colorBackground: "#0a0800",
        colorText: "#DAD5CC",
        colorTextSecondary: "#A9A39A",
        colorDanger: "#f87171",
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: "0px",
        fontSizeBase: "13px",
    },
    rules: {
        ".Input": {
            border: "1px solid rgba(212,175,55,0.2)",
            backgroundColor: "rgba(0,0,0,0.45)",
            padding: "14px 16px",
            color: "#DAD5CC",
        },
        ".Input:focus": {
            border: "1px solid rgba(212,175,55,0.55)",
            boxShadow: "0 0 0 3px rgba(212,175,55,0.08)",
        },
        ".Label": {
            color: "rgba(255,255,255,0.32)",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            fontSize: "9px",
            marginBottom: "8px",
        },
        ".Tab": {
            border: "1px solid rgba(212,175,55,0.15)",
            backgroundColor: "rgba(0,0,0,0.30)",
            color: "rgba(255,255,255,0.4)",
        },
        ".Tab--selected": {
            backgroundColor: "rgba(212,175,55,0.10)",
            borderColor: "rgba(212,175,55,0.4)",
            color: "#D4AF37",
        },
    },
};

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setBusy(true);
        setErr(null);
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/checkout/success` },
        });
        if (error) { setErr(error.message ?? "Payment failed."); setBusy(false); }
        else onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ layout: "tabs", paymentMethodOrder: ["card"] }} />
            {err && (
                <p className="text-[11px] text-red-400 uppercase tracking-widest glass border-red-500/20 bg-red-500/5 px-4 py-3">{err}</p>
            )}
            <motion.button id="checkout-pay-btn" type="submit" disabled={!stripe || busy}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full bg-[#D4AF37] text-black py-4 text-[11px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[54px] shadow-[0_0_40px_rgba(212,175,55,0.25)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all">
                {busy ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing…</> : <><Lock className="w-3.5 h-3.5" /> Complete Purchase</>}
            </motion.button>
            <p className="text-center text-[9px] uppercase tracking-widest text-white/20">Secured by Stripe · 256-bit SSL</p>
        </form>
    );
}

export default function CheckoutPage() {
    const { cart, subtotal: cartTotal, clearCart } = useCart();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paid, setPaid] = useState(false);

    const createIntent = useCallback(async () => {
        if (!cart.length) return;
        setLoading(true);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: cart }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not initiate checkout.");
            setClientSecret(data.clientSecret);
        } catch (e) { setError((e as Error).message); }
        finally { setLoading(false); }
    }, [cart]);

    useEffect(() => { createIntent(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const shipping = cartTotal >= 75 ? 0 : 9.99;
    const tax = cartTotal * 0.08;
    const total = cartTotal + shipping + tax;

    if (paid) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="glass max-w-md w-full p-12 text-center space-y-6">
                <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-[#D4AF37] text-2xl">✓</span>
                </div>
                <h1 className="font-serif text-2xl text-white/90">Order Confirmed</h1>
                <p className="text-[10px] uppercase tracking-widest text-white/35">Your obsidian vault order is being prepared.</p>
                <Link href="/shop" className="inline-block mt-4 px-8 py-3 bg-[#D4AF37] text-black text-[10px] uppercase tracking-widest font-bold min-h-[44px] flex items-center justify-center">Continue Shopping</Link>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white/80 py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10 flex items-center justify-between">
                    <Link href="/shop" id="checkout-back" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-[#D4AF37]/70 transition-colors min-h-[44px]">
                        <ArrowLeft size={13} /> Back
                    </Link>
                    <div className="text-center">
                        <h1 className="font-serif text-lg tracking-widest text-white/80 uppercase">Secure Checkout</h1>
                        <p className="text-[9px] uppercase tracking-widest text-white/25 mt-0.5">Obsidian Palace · Stripe Encrypted</p>
                    </div>
                    <div className="w-20" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="glass p-6 space-y-5 h-fit">
                        <h2 className="text-[11px] uppercase tracking-widest text-white/40">Your Bag</h2>
                        <div className="space-y-4 divide-y divide-white/5">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                                    <div className="relative w-14 h-[70px] flex-shrink-0 border border-[#D4AF37]/10">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#D4AF37] text-black text-[8px] font-bold flex items-center justify-center rounded-full">{item.quantity}</div>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-serif text-white/80 text-sm truncate">{item.name}</p>
                                        {item.variantName && <p className="text-[9px] uppercase tracking-widest text-white/30 mt-0.5">{item.variantName}</p>}
                                    </div>
                                    <span className="text-sm font-serif text-[#D4AF37] flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-[#D4AF37]/10 pt-5 space-y-2">
                            {[
                                { label: "Subtotal", value: `$${cartTotal.toFixed(2)}` },
                                { label: "Shipping", value: shipping === 0 ? "Free" : `$${shipping.toFixed(2)}` },
                                { label: "Est. Tax (8%)", value: `$${tax.toFixed(2)}` },
                            ].map((r) => (
                                <div key={r.label} className="flex justify-between text-[10px] uppercase tracking-widest text-white/30">
                                    <span>{r.label}</span><span>{r.value}</span>
                                </div>
                            ))}
                            <div className="flex justify-between pt-3 border-t border-[#D4AF37]/10">
                                <span className="text-[10px] uppercase tracking-widest text-white/55">Total</span>
                                <span className="font-serif text-xl text-[#D4AF37]">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="glass p-6 space-y-6">
                        <h2 className="text-[11px] uppercase tracking-widest text-white/40">Payment Details</h2>
                        {cart.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-[10px] uppercase tracking-widest text-white/25 mb-4">Your bag is empty.</p>
                                <Link href="/shop" id="checkout-empty-shop" className="text-[#D4AF37]/60 hover:text-[#D4AF37] text-[10px] uppercase tracking-widest transition-colors">Shop Now →</Link>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center py-12 gap-4">
                                <div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                                <p className="text-[9px] uppercase tracking-widest text-white/25">Initializing secure payment…</p>
                            </div>
                        ) : error ? (
                            <div className="space-y-4">
                                <p className="text-[11px] text-red-400/80 uppercase tracking-widest">{error}</p>
                                <button onClick={createIntent} className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors">Retry →</button>
                            </div>
                        ) : clientSecret ? (
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                                <CheckoutForm onSuccess={() => { clearCart(); setPaid(true); }} />
                            </Elements>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
