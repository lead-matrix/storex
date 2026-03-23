"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ArrowLeft, Loader2, Package } from "lucide-react";

interface ShippingSettings {
  standard_rate: string;
  express_rate: string;
  standard_label: string;
  express_label: string;
  free_shipping_threshold: string;
}

export default function CheckoutPage() {
  const { cart, subtotal: cartTotal } = useCart();
  const [shippingOption, setShippingOption] = useState<"standard" | "express">("standard");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ShippingSettings>({
    standard_rate: "7.99",
    express_rate: "29.99",
    standard_label: "Standard Shipping (5-10 Business Days)",
    express_label: "Express Shipping (2-4 Business Days)",
    free_shipping_threshold: "100",
  });

  useEffect(() => {
    async function fetchSettings() {
      if (cart.length === 0) {
        setLoadingSettings(false);
        return;
      }
      try {
        const res = await fetch("/api/shipping-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setSettings(data.settings);
        }
      } catch (e) {
        // fallback to defaults
      } finally {
        setLoadingSettings(false);
      }
    }
    fetchSettings();
  }, [cart]);

  const freeThreshold = parseFloat(settings.free_shipping_threshold ?? "100");
  const standardRate = parseFloat(settings.standard_rate ?? "7.99");
  const expressRate = parseFloat(settings.express_rate ?? "29.99");
  const isFreeShipping = cartTotal >= freeThreshold;

  const shippingCost = shippingOption === "express"
    ? expressRate
    : isFreeShipping ? 0 : standardRate;

  const total = cartTotal + shippingCost;

  const handleProceed = async () => {
    if (!cart.length) return;
    setLoadingCheckout(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, shippingOption }),
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

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 pt-40">
      <div className="container-luxury">
        {/* Header */}
        <div className="mb-20 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-12">
          <Link
            href="/shop"
            className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-luxury-subtext hover:text-white transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Return to Shop
          </Link>
          <div className="text-center">
            <h1 className="font-serif text-4xl tracking-tight text-white uppercase">Checkout</h1>
            <p className="text-[9px] uppercase tracking-[0.5em] text-gold mt-4">Dina Cosmetic</p>
          </div>
          <div className="w-32 hidden md:block" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Order Summary */}
          <div className="bg-obsidian border border-luxury-border p-8 md:p-12">
            <h2 className="text-xl font-serif uppercase tracking-widest text-white mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
              <Package className="w-5 h-5 text-gold" /> Order Summary
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs uppercase tracking-widest text-luxury-subtext mb-8">Your bag is currently empty.</p>
                <Link href="/shop" className="btn-outline-gold inline-block">Browse Collection</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item: any) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-center border-b border-white/5 pb-4">
                    {item.image && (
                      <div className="w-16 h-16 bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      {item.variantName && (
                        <p className="text-[10px] text-luxury-subtext uppercase tracking-widest">{item.variantName}</p>
                      )}
                      <p className="text-[10px] text-luxury-subtext mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm text-white font-light">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs uppercase tracking-widest text-luxury-subtext">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-widest text-luxury-subtext">
                    <span>Shipping</span>
                    <span>
                      {shippingOption === "express"
                        ? `$${expressRate.toFixed(2)}`
                        : isFreeShipping
                        ? "FREE"
                        : `$${standardRate.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm uppercase tracking-widest text-white border-t border-white/10 pt-3 font-medium">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Options + CTA */}
          <div className="bg-obsidian border border-luxury-border p-8 md:p-12 relative animate-in fade-in duration-700 flex flex-col">
            <h2 className="text-xl font-serif uppercase tracking-widest text-white mb-8 border-b border-white/5 pb-4">
              Shipping Method
            </h2>

            {loadingSettings ? (
              <div className="flex items-center justify-center flex-grow py-12">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 flex-grow">
                {/* Standard Option */}
                <label
                  className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                    shippingOption === "standard"
                      ? "border-gold bg-gold/5"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingOption"
                    value="standard"
                    checked={shippingOption === "standard"}
                    onChange={() => setShippingOption("standard")}
                    className="mt-1 accent-gold"
                  />
                  <div className="flex-grow">
                    <p className="text-sm text-white font-medium">
                      {settings.standard_label || "Standard Shipping (5-10 Business Days)"}
                    </p>
                    <p className="text-[10px] text-luxury-subtext uppercase tracking-widest mt-1">5–10 Business Days</p>
                  </div>
                  <span className={`text-sm font-medium ${isFreeShipping ? "text-gold" : "text-white"}`}>
                    {isFreeShipping ? "FREE" : `$${standardRate.toFixed(2)}`}
                  </span>
                </label>

                {/* Express Option */}
                <label
                  className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                    shippingOption === "express"
                      ? "border-gold bg-gold/5"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingOption"
                    value="express"
                    checked={shippingOption === "express"}
                    onChange={() => setShippingOption("express")}
                    className="mt-1 accent-gold"
                  />
                  <div className="flex-grow">
                    <p className="text-sm text-white font-medium">
                      {settings.express_label || "Express Shipping (2-4 Business Days)"}
                    </p>
                    <p className="text-[10px] text-luxury-subtext uppercase tracking-widest mt-1">2–4 Business Days</p>
                  </div>
                  <span className="text-sm font-medium text-white">${expressRate.toFixed(2)}</span>
                </label>

                {isFreeShipping && (
                  <p className="text-[10px] text-gold uppercase tracking-widest text-center py-2">
                    ✦ Free standard shipping applied — order over ${freeThreshold.toFixed(0)}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-950/20 border border-red-500/20 rounded-sm">
                <p className="text-sm text-red-400 font-light tracking-wide">{error}</p>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleProceed}
                disabled={loadingCheckout || cart.length === 0 || loadingSettings}
                className="btn-gold w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCheckout ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>PROCEED TO CHECKOUT →</>
                )}
              </button>
              <p className="text-[9px] text-luxury-subtext text-center mt-4 uppercase tracking-widest">
                Secured by Stripe · Address collected at payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
