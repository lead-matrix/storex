"use client";

import { useState } from "react";
import { Zap, Check, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QuickShipProps {
  orderId: string;
  customerName: string;
  shippingAddress: any;
  orderItems: any[];
  onSuccess?: () => void;
}

export default function QuickShip({ orderId, customerName, shippingAddress, orderItems, onSuccess }: QuickShipProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const router = useRouter();

  const isInternational = shippingAddress?.country && shippingAddress.country !== "US";

  async function handleQuickShip() {
    if (isInternational) return; // Redirect to full ritual for international
    setStatus("loading");
    try {
      // Fetch rates - pick cheapest USPS
      const ratesRes = await fetch("/admin/orders/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetchRates", orderId }),
      });

      // Use the server action directly
      const { fetchShippingRatesAction, completeFulfillmentAction } = await import(
        "@/app/admin/orders/actions"
      );

      const ratesData = await fetchShippingRatesAction(
        orderId,
        orderItems.map(i => ({ id: i.id, quantity: i.quantity - (i.fulfilled_quantity || 0) }))
      );

      if (!ratesData.rates || ratesData.rates.length === 0) {
        throw new Error("No shipping rates returned from Shippo");
      }

      // Auto-select cheapest USPS Priority or just cheapest available
      const uspsRates = ratesData.rates.filter(r => r.provider === "USPS");
      const bestRate = uspsRates.length > 0
        ? uspsRates.sort((a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount))[0]
        : ratesData.rates.sort((a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount))[0];

      const result = await completeFulfillmentAction(
        orderId,
        bestRate.id,
        bestRate.provider,
        bestRate.service,
        orderItems.map(i => ({ id: i.id, quantity: i.quantity - (i.fulfilled_quantity || 0) }))
      );

      setTrackingNumber(result.trackingNumber);
      setLabelUrl(result.labelUrl);
      setStatus("done");
      toast.success(`Shipped via ${bestRate.provider} — ${bestRate.service}`);
      onSuccess?.();
      router.refresh();
    } catch (err: any) {
      setStatus("error");
      toast.error(err.message || "Quick ship failed");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
          <Check className="w-3.5 h-3.5" />
          Shipped
        </div>
        {labelUrl && (
          <a
            href={labelUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border border-[#D4AF37]/30 text-[#D4AF37] px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-all"
          >
            <Truck className="w-3.5 h-3.5" />
            Print Label
          </a>
        )}
      </div>
    );
  }

  if (isInternational) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
        <span>🌍 International — use full Fulfill flow</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleQuickShip}
      disabled={status === "loading"}
      className="flex items-center gap-2 bg-[#D4AF37] text-black px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 group"
    >
      {status === "loading" ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Processing...
        </>
      ) : status === "error" ? (
        <>
          <span>⚠️</span>
          Retry
        </>
      ) : (
        <>
          <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          Quick Ship (US)
        </>
      )}
    </button>
  );
}
