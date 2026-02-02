"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CheckoutSuccessPage() {
    const { clearCart } = useCart();

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
            <div className="relative w-24 h-24 mb-12">
                <Image src="/logo.jpg" alt="Logo" fill className="object-contain opacity-50" />
            </div>

            <div className="bg-gold/10 p-6 rounded-full mb-8">
                <CheckCircle2 className="w-12 h-12 text-gold" />
            </div>

            <h1 className="text-4xl md:text-6xl font-serif mb-4 tracking-tight">Order Authenticated</h1>
            <p className="text-white/50 uppercase tracking-[0.4em] text-xs mb-12 max-w-sm leading-loose">
                Your selection has been secured.
                A confirmation email will arrive at the speed of light.
            </p>

            <div className="w-12 h-px bg-gold/30 mb-12" />

            <Link href="/" className="group flex items-center gap-3 border border-gold/30 px-10 py-4 text-gold hover:bg-gold hover:text-black transition-all duration-700 uppercase text-[10px] tracking-[0.4em]">
                Return To Palace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
            </Link>

            <div className="mt-24 text-[9px] text-white/20 uppercase tracking-[0.5em]">
                DINA COSMETIC | SECURE TRANSACTION
            </div>
        </div>
    );
}
