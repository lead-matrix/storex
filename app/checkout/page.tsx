"use client";

import { useEffect, useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ArrowLeft, Loader2, Package, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const { cart, subtotal: cartTotal } = useCart();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeThreshold, setFreeThreshold] = useState(100);

  // Fetch just the free-shipping threshold to show the badge
  useEffect(() => {
    fetch("/api/shipping-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [] }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.free_shipping_threshold) {
          setFreeThreshold(parseFloat(d.settings.free_shipping_threshold));
        }
      })
      .catch(() => {});
  }, []);

  const isFreeShipping = cartTotal >= freeThreshold;
  const remaining = freeThreshold - cartTotal;

  const totalWeightLb = useMemo(() => {
    return cart.reduce((total, item) => {
      const weightOz = item.variantWeight || item.productWeight || 2;
      return total + (weightOz * item.quantity);
    }, 0) / 16;
  }, [cart]);

  const handleProceed = async () => {
    if (!cart.length) return;
    setLoadingCheckout(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
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
                  <div className="flex justify-between text-xs uppercase tracking-widest text-luxury-subtext transition-all duration-500 hover:text-white">
                    <span className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-gold/60" />
                        Estimated weight
                    </span>
                    <span>{totalWeightLb.toFixed(2)} lbs</span>
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-widest text-luxury-subtext">
                    <span>Shipping</span>
                    <span className={isFreeShipping ? "text-gold font-medium" : ""}>
                      {isFreeShipping ? "FREE ✦" : "Calculated at checkout"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm uppercase tracking-widest text-white border-t border-white/10 pt-3 font-medium">
                    <span>Estimated Total</span>
                    <span>${cartTotal.toFixed(2)}{!isFreeShipping && " + shipping"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout CTA */}
          <div className="bg-obsidian border border-luxury-border p-8 md:p-12 flex flex-col gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-serif uppercase tracking-widest text-white border-b border-white/5 pb-4">
                Secure Checkout
              </h2>

              {/* Free shipping progress */}
              {!isFreeShipping && (
                <div className="bg-gold/5 border border-gold/20 rounded-sm p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-gold">
                    Add ${remaining.toFixed(2)} more for FREE Standard Shipping
                  </p>
                  <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all duration-500"
                      style={{ width: `${Math.min((cartTotal / freeThreshold) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {isFreeShipping && (
                <p className="text-[10px] text-gold uppercase tracking-widest text-center py-2">
                  ✦ Free standard shipping applied — order over ${freeThreshold.toFixed(0)}
                </p>
              )}

              {/* What happens at Stripe */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] uppercase tracking-widest text-luxury-subtext">You will select your shipping method on the next screen, along with:</p>
                <ul className="space-y-2">
                  {[
                    "Name & email address",
                    "Shipping address (with auto-complete)",
                    "Standard · Express · International options",
                    "Card payment — secured by Stripe",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[10px] text-luxury-subtext">
                      <ShieldCheck className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-sm">
                <p className="text-sm text-red-400 font-light tracking-wide">{error}</p>
              </div>
            )}

            <div className="mt-auto space-y-4">
              <button
                onClick={handleProceed}
                disabled={loadingCheckout || cart.length === 0}
                className="btn-gold w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCheckout ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>PROCEED TO CHECKOUT →</>
                )}
              </button>
              <p className="text-[9px] text-luxury-subtext text-center uppercase tracking-widest">
                Secured by Stripe · Address &amp; shipping selected at payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
