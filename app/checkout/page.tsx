"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STRIPE_APPEARANCE: NonNullable<Parameters<typeof Elements>[0]["options"]>["appearance"] = {
    theme: "night",
    variables: {
        colorPrimary: "#C6A75E", // gold
        colorBackground: "#0f0f0f",
        colorText: "#ffffff",
        colorTextSecondary: "#b3b3b3",
        colorDanger: "#dc2626",
        fontFamily: "var(--font-inter), sans-serif",
        borderRadius: "14px",
        fontSizeBase: "14px",
    },
    rules: {
        ".Input": {
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#1a1a1a",
            padding: "12px 16px",
            color: "#ffffff",
        },
        ".Input:focus": {
            borderColor: "#C6A75E",
            boxShadow: "0 0 0 1px #C6A75E",
        },
        ".Label": {
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontSize: "12px",
            fontWeight: "500",
            marginBottom: "8px",
        },
    },
};

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
            // Redirect to Stripe hosted checkout (works for guests + signed in users)
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned.");
            }
        } catch (e) { setError((e as Error).message); }
        finally { setLoading(false); }
    }, [cart]);

    useEffect(() => { createIntent(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const shipping = cartTotal >= 75 ? 0 : 9.99;
    const tax = cartTotal * 0.08;
    const total = cartTotal + shipping + tax;

    if (paid) return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6 py-20">
            <div className="bg-obsidian max-w-md w-full p-12 text-center flex flex-col items-center border border-luxury-border shadow-luxury animate-in fade-in duration-700">
                <div className="w-16 h-16 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-gold">
                    <span className="text-gold text-2xl">✓</span>
                </div>
                <h1 className="font-serif text-3xl text-white mb-6 uppercase tracking-widest">Masterpiece Confirmed</h1>
                <p className="text-sm tracking-wide text-luxury-subtext mb-10 leading-relaxed font-light font-serif italic text-gold">
                    "Your selection from the Obsidian collection is being prepared for the ritual."
                </p>
                <Link href="/shop" className="btn-gold w-full text-center">
                    Return to Boutique
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white py-12 px-6 pt-40">
            <div className="container-luxury">
                <div className="mb-20 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-12">
                    <Link href="/shop" className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-luxury-subtext hover:text-white transition-all group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Return to Boutique
                    </Link>
                    <div className="text-center">
                        <h1 className="font-serif text-4xl tracking-tight text-white uppercase">Secure Checkout</h1>
                        <p className="text-[9px] uppercase tracking-[0.5em] text-gold mt-4">The Obsidian Palace Collection</p>
                    </div>
                    <div className="w-32 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <div>
                        <OrderSummary
                            cart={cart}
                            subtotal={cartTotal}
                            shipping={shipping}
                            tax={tax}
                            total={total}
                        />
                    </div>

                    <div className="bg-obsidian border border-luxury-border p-8 md:p-12">
                        {cart.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-xs uppercase tracking-widest text-luxury-subtext mb-8">Your bag is currently empty.</p>
                                <Link href="/shop" className="btn-outline-gold inline-block">
                                    Browse Collection
                                </Link>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                                <div className="w-10 h-10 border-2 border-white/5 border-t-gold rounded-full animate-spin mb-6" />
                                <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">Initializing secure gate…</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-red-500 mb-8 font-light tracking-wide">{error}</p>
                                <button onClick={createIntent} className="btn-outline-gold">
                                    Try Again
                                </button>
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
