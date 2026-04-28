"use client";

import { useEffect, useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ArrowLeft, Loader2, Package, ShieldCheck, Mail, Ticket, CheckCircle2, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const { cart, subtotal: cartTotal, syncAbandonedCart } = useCart();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeThreshold, setFreeThreshold] = useState(100);
  
  // New state for abandoned cart and coupons
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);


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

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount: cartTotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponData(data);
      } else {
        setCouponError(data.message || "Invalid coupon");
        setCouponData(null);
      }
    } catch (e) {
      setCouponError("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleEmailBlur = () => {
    if (email && email.includes("@")) {
      syncAbandonedCart(email);
    }
  };

  const discountedTotal = useMemo(() => {
    if (!couponData) return cartTotal;
    return Math.max(0, cartTotal - Number(couponData.discount_amount));
  }, [cartTotal, couponData]);


  const handleProceed = async () => {
    if (!cart.length) return;
    setLoadingCheckout(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            items: cart,
            email: email,
            couponCode: couponData?.valid ? couponCode : null
        }),
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
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain object-center" />
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
                  {couponData && (
                    <div className="flex justify-between text-xs uppercase tracking-widest text-emerald-500 font-medium">
                      <span>Discount ({couponCode})</span>
                      <span>-${Number(couponData.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm uppercase tracking-widest text-white border-t border-white/10 pt-3 font-medium">
                    <span>Estimated Total</span>
                    <span>${discountedTotal.toFixed(2)}{!isFreeShipping && " + shipping"}</span>
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

              {/* Email Capture */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-subtext flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gold" />
                  Your Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="For order tracking & recovery..."
                  className="w-full bg-black/40 border border-white/10 rounded-none px-4 py-3 text-xs outline-none focus:border-gold/50 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Coupon Input */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-subtext flex items-center gap-2">
                  <Ticket className="w-3 h-3 text-gold" />
                  Privilege Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code..."
                    className="flex-grow bg-black/40 border border-white/10 rounded-none px-4 py-3 text-xs outline-none focus:border-gold/50 transition-all placeholder:text-white/20"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode}
                    className="bg-white text-black px-6 text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-all disabled:opacity-50"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[9px] text-red-400 uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
                {couponData && (
                  <p className="text-[9px] text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Code Applied: {couponData.discount_type === 'percentage' ? `${couponData.discount_value}%` : `$${couponData.discount_value}`} off
                  </p>
                )}
              </div>

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
