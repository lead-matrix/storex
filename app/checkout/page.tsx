"use client";

import { useEffect, useState, FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";

export default function CheckoutPage() {
    const { cart, subtotal: cartTotal, clearCart } = useCart();

    // States
    const [step, setStep] = useState<1 | 2>(1);
    const [loadingRates, setLoadingRates] = useState(false);
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rates, setRates] = useState<any[]>([]);
    const [selectedRateId, setSelectedRateId] = useState<string>("");

    const [address, setAddress] = useState({
        email: "",
        name: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "US"
    });

    const [paid, setPaid] = useState(false);

    useEffect(() => {
        // If we returned from successful checkout
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("success") === "true") {
                clearCart();
                setPaid(true);
            }
        }
    }, [clearCart]);

    const handleAddressSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!cart.length) return;

        setLoadingRates(true);
        setError(null);

        try {
            const res = await fetch("/api/shippo/rates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: cart, address }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error ?? "Failed to calculate shipping rates.");

            if (data.rates && data.rates.length > 0) {
                // Filter and sort rates by amount
                const validRates = data.rates.sort((a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount));
                setRates(validRates);
                setSelectedRateId(validRates[0].object_id);
                setStep(2);
            } else {
                throw new Error("No shipping rates available for this destination.");
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingRates(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!selectedRateId) return;
        setLoadingCheckout(true);
        setError(null);

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: cart, address, selectedRateId }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error ?? "Could not initiate checkout.");

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned.");
            }
        } catch (e: any) {
            setError(e.message);
            setLoadingCheckout(false);
        }
    };

    const tax = cartTotal * 0.08;
    const currentShippingCost = rates.find(r => r.object_id === selectedRateId)?.amount
        ? parseFloat(rates.find(r => r.object_id === selectedRateId)?.amount)
        : 0;
    const total = cartTotal + currentShippingCost + tax;

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
                        <h1 className="font-serif text-4xl tracking-tight text-white uppercase">Checkout Process</h1>
                        <p className="text-[9px] uppercase tracking-[0.5em] text-gold mt-4">The Obsidian Palace Collection</p>
                    </div>
                    <div className="w-32 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <div>
                        <OrderSummary
                            cart={cart}
                            subtotal={cartTotal}
                            shipping={currentShippingCost}
                            tax={tax}
                            total={total}
                            shippingCalculated={step === 2}
                        />
                    </div>

                    <div className="bg-obsidian border border-luxury-border p-8 md:p-12 relative animate-in fade-in duration-700">
                        {cart.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-xs uppercase tracking-widest text-luxury-subtext mb-8">Your bag is currently empty.</p>
                                <Link href="/shop" className="btn-outline-gold inline-block">
                                    Browse Collection
                                </Link>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center bg-red-950/20 border border-red-500/20 rounded-md">
                                <p className="text-sm text-red-400 mb-8 font-light tracking-wide">{error}</p>
                                <button onClick={() => { setError(null); setStep(1) }} className="btn-outline-gold text-xs">
                                    Change Address
                                </button>
                            </div>
                        ) : step === 1 ? (
                            <form onSubmit={handleAddressSubmit} className="space-y-6">
                                <h2 className="text-xl font-serif uppercase tracking-widest text-white mb-6 border-b border-white/5 pb-4">
                                    1. Shipping Destination
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">Email Address</label>
                                        <input required type="email" value={address.email} onChange={e => setAddress({ ...address, email: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors" placeholder="your@email.com" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">Full Name</label>
                                        <input required type="text" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors" placeholder="First Last" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">Address Line 1</label>
                                        <input required type="text" value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors" placeholder="123 Luxury Ave" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">Address Line 2 (Optional)</label>
                                        <input type="text" value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors" placeholder="Apt, Suite, Unit" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">City</label>
                                            <input required type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">State / Province</label>
                                            <input required type="text" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">Postal Code</label>
                                            <input required type="text" value={address.postal_code} onChange={e => setAddress({ ...address, postal_code: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-luxury-subtext mb-2">Country Code</label>
                                            <input required minLength={2} maxLength={2} type="text" value={address.country} onChange={e => setAddress({ ...address, country: e.target.value.toUpperCase() })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-gold outline-none transition-colors uppercase" placeholder="US" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={loadingRates} className="btn-gold w-full flex items-center justify-center gap-3 mt-8">
                                    {loadingRates ? <><Loader2 className="animate-spin" size={16} /> Calculating Rates...</> : "Continue to Delivery Method"}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <h2 className="text-xl font-serif uppercase tracking-widest text-white">
                                        2. Delivery Method
                                    </h2>
                                    <button onClick={() => setStep(1)} className="text-[10px] uppercase text-gold hover:underline">Edit Address</button>
                                </div>

                                <div className="space-y-4">
                                    {rates.map((rate) => (
                                        <label key={rate.object_id} className={`flex items-start p-4 border cursor-pointer transition-all duration-300 ${selectedRateId === rate.object_id ? "border-gold bg-gold/5" : "border-white/10 hover:border-white/30"}`}>
                                            <input
                                                type="radio"
                                                name="shipping_rate"
                                                className="mt-1 mr-4 accent-gold"
                                                checked={selectedRateId === rate.object_id}
                                                onChange={() => setSelectedRateId(rate.object_id)}
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{rate.provider} - {rate.servicelevel?.name}</h4>
                                                    <span className="text-gold font-serif">${parseFloat(rate.amount).toFixed(2)}</span>
                                                </div>
                                                <p className="text-[11px] text-luxury-subtext uppercase tracking-widest mt-2 flex items-center gap-2">
                                                    <Package size={12} className="text-white/40" /> Estimated Transit: {rate.estimated_days || rate.days || "3-5"} Business Days
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <button onClick={handleProceedToPayment} disabled={loadingCheckout} className="btn-gold w-full flex items-center justify-center gap-3 mt-8">
                                    {loadingCheckout ? <><Loader2 className="animate-spin" size={16} /> Initializing Secure PaymentGate...</> : "Continue to Payment"}
                                </button>

                                <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 text-center mt-6">
                                    You will not be charged yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
