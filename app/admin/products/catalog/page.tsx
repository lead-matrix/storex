import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { CatalogSpreadsheet } from "@/components/admin/CatalogSpreadsheet";
import { Grid, Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
    const supabase = await createClient();

    let { data: products, error } = await supabase
        .from("products")
        .select(`*, categories(name), variants:product_variants(*)`)
        .order("created_at", { ascending: false });

    if (error || !products) {
        const adminSupabase = await createAdminClient();
        const { data: adminProducts } = await adminSupabase
            .from("products")
            .select(`*, categories(name), variants:product_variants(*)`)
            .order("created_at", { ascending: false });
        products = adminProducts;
    }

    return (
        <div className="space-y-8 animate-luxury-fade pb-24">
            <div className="flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/admin/products" className="p-2 border border-white/5 hover:border-gold/30 hover:text-gold transition-all text-white/30 rounded-full">
                            <ArrowLeft size={14} />
                        </Link>
                        <h1 className="text-4xl font-heading text-white tracking-luxury font-serif uppercase text-shadow-gold">Catalog Mode</h1>
                    </div>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold pl-12">Bulk Product Synchronizer · Absolute Zero Lag</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Live Sync Active</span>
                    </div>
                </div>
            </div>

            <CatalogSpreadsheet initialProducts={products || []} />
        </div>
    );
}
