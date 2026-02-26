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
    theme: "stripe",
    variables: {
        colorPrimary: "#C6A85C", // gold
        colorBackground: "#ffffff",
        colorText: "#1F1F1F", // charcoal
        colorTextSecondary: "#6E6A66", // textsoft
        colorDanger: "#dc2626", // red-600
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: "14px", // luxury radius
        fontSizeBase: "14px",
    },
    rules: {
        ".Input": {
            border: "1px solid rgba(31,31,31,0.2)", // charcoal/20
            boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)", // shadow-soft
            backgroundColor: "#ffffff",
            padding: "12px 16px",
            color: "#1F1F1F",
        },
        ".Input:focus": {
            border: "1px solid rgba(198,168,92,0.8)", // gold
            boxShadow: "0 0 0 1px rgba(198,168,92,0.8)",
        },
        ".Label": {
            color: "#1F1F1F",
            textTransform: "uppercase",
            letterSpacing: "0.15em", // tracking-luxury
            fontSize: "12px",
            fontWeight: "500",
            marginBottom: "8px",
        },
        ".Tab": {
            border: "1px solid rgba(31,31,31,0.1)",
            backgroundColor: "#F6F3EE", // pearl
            color: "#6E6A66",
            boxShadow: "none",
        },
        ".Tab--selected": {
            backgroundColor: "#ffffff",
            borderColor: "rgba(198,168,92,0.5)", // gold/50
            color: "#1F1F1F",
            boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
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
            setClientSecret(data.clientSecret);
        } catch (e) { setError((e as Error).message); }
        finally { setLoading(false); }
    }, [cart]);

    useEffect(() => { createIntent(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const shipping = cartTotal >= 75 ? 0 : 9.99;
    const tax = cartTotal * 0.08;
    const total = cartTotal + shipping + tax;

    if (paid) return (
        <div className="min-h-screen bg-pearl flex items-center justify-center px-6 section-padding">
            <div className="bg-white max-w-md w-full p-12 text-center flex flex-col items-center rounded-luxury shadow-luxury border border-charcoal/5 animate-luxury-fade">
                <div className="w-16 h-16 bg-pearl border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-gold text-2xl font-light">✓</span>
                </div>
                <h1 className="font-heading tracking-luxury text-3xl text-charcoal mb-4">Order Confirmed</h1>
                <p className="text-sm tracking-luxury text-textsoft mb-8">
                    Your exquisite selection from Obsidian Palace is being prepared. Follow updates via email.
                </p>
                <Link href="/shop" className="inline-block px-8 py-4 bg-charcoal text-white text-xs uppercase tracking-luxury font-medium hover:bg-gold transition-colors w-full rounded-md shadow-soft">
                    Continue Shopping
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-pearl text-charcoal py-12 px-6 pt-32">
            <div className="max-w-5xl mx-auto">
                <div className="mb-12 flex items-center justify-between">
                    <Link href="/shop" id="checkout-back" className="flex items-center gap-2 text-xs uppercase tracking-luxury text-textsoft hover:text-charcoal transition-colors">
                        <ArrowLeft size={16} /> Return to Shop
                    </Link>
                    <div className="text-center">
                        <h1 className="font-heading text-2xl tracking-luxury text-charcoal uppercase">Secure Checkout</h1>
                        <p className="text-[10px] uppercase tracking-luxury text-textsoft mt-1">Obsidian Palace · Stripe Encrypted</p>
                    </div>
                    <div className="w-32 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Order Summary */}
                    <div>
                        <OrderSummary
                            cart={cart}
                            subtotal={cartTotal}
                            shipping={shipping}
                            tax={tax}
                            total={total}
                        />
                    </div>

                    {/* Payment Details */}
                    <div>
                        {cart.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-luxury border border-charcoal/5 shadow-soft">
                                <p className="text-sm tracking-luxury text-textsoft mb-6 uppercase">Your elegant bag is empty.</p>
                                <Link href="/shop" id="checkout-empty-shop" className="text-charcoal font-medium hover:text-gold text-xs uppercase tracking-luxury transition-colors border-b border-charcoal hover:border-gold pb-1">
                                    Discover Collection
                                </Link>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-luxury border border-charcoal/5 shadow-soft">
                                <div className="w-8 h-8 border-2 border-charcoal/20 border-t-gold rounded-full animate-spin mb-4" />
                                <p className="text-xs uppercase tracking-luxury text-textsoft">Initializing secure payment gateway…</p>
                            </div>
                        ) : error ? (
                            <div className="bg-white p-8 rounded-luxury border border-charcoal/5 shadow-soft text-center">
                                <p className="text-sm text-red-600 mb-6">{error}</p>
                                <button onClick={createIntent} className="text-xs uppercase tracking-luxury text-charcoal hover:text-gold transition-colors font-medium border-b border-charcoal hover:border-gold pb-1">
                                    Refresh Session
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
