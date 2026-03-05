import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MoreHorizontal, ChevronDown, ChevronUp, Trash2, ToggleLeft, ToggleRight, Edit, Package, Layers, Activity } from "lucide-react";
import Link from "next/link";
import { adjustStock, toggleProductStatus, deleteProduct } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
    const supabase = await createClient();

    // ── DATA FETCHING ──
    let { data: products, error } = await supabase
        .from("products")
        .select(`
            *, 
            categories(name),
            product_variants(
                id, price, compare_price,
                inventory(stock_quantity)
            )
        `)
        .order("created_at", { ascending: false });

    if (error || !products) {
        console.warn("Retrying with Admin Client due to RLS/Role mismatch:", error);
        const adminSupabase = await createAdminClient();
        const { data: adminProducts } = await adminSupabase
            .from("products")
            .select(`
                *, 
                categories(name),
                product_variants(
                    id, price, compare_price,
                    inventory(stock_quantity)
                )
            `)
            .order("created_at", { ascending: false });
        products = adminProducts;
    }

    const processedProducts = products?.map(p => {
        const variants = p.product_variants || [];
        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.inventory?.stock_quantity || 0), 0);
        const firstVariantPrice = variants[0]?.price || 0;
        const firstVariantCompare = variants[0]?.compare_price || null;

        return {
            ...p,
            name: p.title, // alias for UI compatibility if needed
            stock: totalStock,
            display_price: firstVariantPrice,
            display_compare: firstVariantCompare,
            is_active: p.status === 'active',
            first_variant_id: variants[0]?.id
        };
    }) || [];

    const { data: categories } = await supabase.from("categories").select("id, name");

    // KPIs
    const totalCount = processedProducts.length;
    const activeCount = processedProducts.filter((p) => p.is_active).length;
    const lowStockCount = processedProducts.filter((p) => p.stock < 10).length;
    const outOfStockCount = processedProducts.filter((p) => p.stock === 0).length;

    return (
        <div className="space-y-12 animate-luxury-fade pb-24">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase text-shadow-gold">Collections</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">Asset Registry · Inventory Management</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 bg-gold text-black px-6 py-3 rounded text-[11px] font-bold uppercase tracking-luxury hover:bg-gold-light transition-all shadow-gold"
                >
                    <Plus className="w-4 h-4" />
                    Archive New Asset
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: "Total Assets", value: totalCount, icon: Package, color: "text-white" },
                    { label: "Live Display", value: activeCount, icon: Layers, color: "text-emerald-400" },
                    { label: "Low Reserve", value: lowStockCount, icon: Activity, color: "text-amber-400" },
                    { label: "Depleted", value: outOfStockCount, icon: Trash2, color: "text-red-400" },
                ].map((s) => (
                    <div key={s.label} className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-6 group transition-all hover:border-gold/30">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] uppercase tracking-luxury font-bold text-white/30">{s.label}</p>
                            <s.icon className={`w-4 h-4 ${s.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <p className={`text-4xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Products Table */}
            <div className="bg-obsidian border border-luxury-border rounded-luxury overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-luxury text-gold font-bold">
                                <th className="px-8 py-5">Piece Information</th>
                                <th className="px-8 py-5">Category</th>
                                <th className="px-8 py-5 text-right">Valuation</th>
                                <th className="px-8 py-5 text-center">Reserve</th>
                                <th className="px-8 py-5 text-center">Visibility</th>
                                <th className="px-8 py-5 text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-white/60 font-medium divide-y divide-white/5">
                            {processedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black/40 border border-white/10 rounded overflow-hidden shadow-soft flex-shrink-0 group-hover:border-gold/30 transition-colors">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/5">
                                                        <Package size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-sm font-serif truncate max-w-[200px] group-hover:text-gold transition-colors">{product.title}</p>
                                                <p className="text-[10px] text-white/30 truncate mt-1 tracking-luxury uppercase">{product.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] uppercase tracking-widest text-gold/60">
                                            {product.categories?.name || 'Unfiltered'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="space-y-1">
                                            <p className="text-white font-serif text-sm">${Number(product.display_price).toFixed(2)}</p>
                                            {product.display_compare && (
                                                <p className="text-gold text-[9px] font-bold tracking-luxury uppercase underline decoration-red-500/50">Was ${Number(product.display_compare).toFixed(2)}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            {product.first_variant_id ? (
                                                <>
                                                    <form action={async () => { "use server"; await adjustStock(product.first_variant_id, -1); }}>
                                                        <button className="w-6 h-6 border border-white/10 flex items-center justify-center rounded-sm hover:border-gold/30 hover:text-gold transition-all text-white/20">
                                                            <ChevronUp className="w-3 h-3 rotate-180" />
                                                        </button>
                                                    </form>
                                                    <span className={`font-mono text-sm min-w-[28px] ${product.stock === 0 ? "text-red-500 font-bold" : product.stock < 10 ? "text-amber-400 font-bold" : "text-white"}`}>
                                                        {product.stock}
                                                    </span>
                                                    <form action={async () => { "use server"; await adjustStock(product.first_variant_id, 1); }}>
                                                        <button className="w-6 h-6 border border-white/10 flex items-center justify-center rounded-sm hover:border-gold/30 hover:text-gold transition-all text-white/20">
                                                            <ChevronUp className="w-3 h-3" />
                                                        </button>
                                                    </form>
                                                </>
                                            ) : (
                                                <span className="text-white/10 italic text-[10px]">No Variants</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <form action={async () => { "use server"; await toggleProductStatus(product.id, product.status); }}>
                                            <button className={`transition-all ${product.is_active ? "text-emerald-400 hover:text-white" : "text-white/20 hover:text-white"}`}>
                                                {product.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                        </form>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link href={`/admin/products/${product.id}`} className="p-2 border border-white/5 hover:border-gold/30 hover:text-gold transition-all text-white/30 rounded-sm">
                                                <Edit size={14} />
                                            </Link>
                                            <form action={async () => { "use server"; await deleteProduct(product.id); }}>
                                                <button className="p-2 border border-white/5 hover:border-red-500/30 hover:text-red-400 transition-all text-white/30 rounded-sm">
                                                    <Trash2 size={14} />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
