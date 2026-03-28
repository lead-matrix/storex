import { ShieldCheck, Truck, RotateCcw, Star } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    text: "Secure Checkout",
    sub: "256-bit SSL encryption",
  },
  {
    icon: Truck,
    text: "Free Shipping $75+",
    sub: "Standard & express options",
  },
  {
    icon: RotateCcw,
    text: "30-Day Returns",
    sub: "Hassle-free guarantee",
  },
  {
    icon: Star,
    text: "4.9/5 Stars",
    sub: "From 247+ reviews",
    gold: true,
  },
];

interface TrustBarProps {
  variant?: "light" | "dark";
}

export default function TrustBar({ variant = "light" }: TrustBarProps) {
  const isLight = variant === "light";

  return (
    <div className={`w-full border-y py-5 px-6 ${isLight ? "bg-[#F5F1EB] border-[#1A1A1A]/8" : "bg-[#121214] border-white/10"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-[#1A1A1A]/10">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-0 md:px-6 first:pl-0 last:pr-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.gold
                  ? "bg-[#D4AF37]/10"
                  : isLight ? "bg-[#1A1A1A]/5" : "bg-white/5"
              }`}>
                <item.icon className={`w-4 h-4 ${item.gold ? "text-[#D4AF37]" : isLight ? "text-[#1A1A1A]" : "text-white"}`} />
              </div>
              <div>
                <p className={`text-[12px] font-bold ${isLight ? "text-[#1A1A1A]" : "text-white"}`}>
                  {item.text}
                </p>
                <p className={`text-[10px] ${isLight ? "text-[#4A4A4A]/60" : "text-white/40"}`}>
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
