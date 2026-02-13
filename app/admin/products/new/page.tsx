"use client";

import { createClient } from "@/lib/supabase/client";
import { ProductForm } from "@/components/admin/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link
                href="/admin/products"
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-zinc-500 hover:text-gold transition-colors"
            >
                <ArrowLeft size={12} />
                Back to Vault
            </Link>

            <div>
                <h2 className="text-3xl font-serif text-gold mb-1">Forge New Item</h2>
                <p className="text-zinc-500 text-sm tracking-widest uppercase">Add a new masterpiece to the Obsidian collection</p>
            </div>

            <div className="bg-zinc-950 border border-gold/10 p-8 shadow-2xl">
                <ProductForm />
            </div>
        </div>
    );
}
