import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MoreHorizontal, ChevronDown, ChevronUp, Trash2, ToggleLeft, ToggleRight, Edit, Package, Layers, Activity, Download, Upload } from "lucide-react";
import Link from "next/link";
import { adjustStock, toggleProductStatus, deleteProduct } from "@/lib/actions/admin";
import { BulkImportButton } from "@/components/admin/BulkImportButton";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
    const supabase = await createClient();

    // ── DATA FETCHING ──
    let { data: products, error } = await supabase
        .from("products")
        .select(`*, categories(name)`)
        .order("created_at", { ascending: false });

    if (error || !products) {
        console.warn("Retrying with Admin Client due to RLS/Role mismatch:", error);
        const adminSupabase = await createAdminClient();
        const { data: adminProducts } = await adminSupabase
            .from("products")
            .select(`*, categories(name)`)
            .order("created_at", { ascending: false });
        products = adminProducts;
    }

    // Fetch first variant for each product to correctly adjust stock
    const productIds = (products ?? []).map((p: any) => p.id);
    let variantMap: Record<string, string> = {};
    if (productIds.length > 0) {
        const { data: firstVariants } = await supabase
            .from("product_variants")
            .select("id, product_id")
            .in("product_id", productIds)
            .order("created_at", { ascending: true });
        // Keep only the first variant per product
        firstVariants?.forEach((v: any) => {
            if (!variantMap[v.product_id]) variantMap[v.product_id] = v.id;
        });
    }

    const processedProducts = products?.map((p: any) => ({
        ...p,
        name: p.title || p.name,
        stock: p.stock ?? 0,
        display_price: p.base_price || 0,
        display_compare: p.sale_price || null,
        is_active: p.status === 'active',
        first_variant_id: variantMap[p.id] || null   // null = no variants → adjustStock falls back to products table
    })) || [];

    const { data: categories } = await supabase.from("categories").select("id, name");

    // KPIs
    const totalCount = processedProducts.length;
    const activeCount = processedProducts.filter((p) => p.is_active).length;
    const lowStockCount = processedProducts.filter((p) => p.stock < 10).length;
    const outOfStockCount = processedProducts.filter((p) => p.stock === 0).length;

    return (
        <div className="space-y-12 animate-luxury-fade pb-24">
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase text-shadow-gold">Products</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">Product Catalog · Inventory Management</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href="/api/admin/products/export"
                        className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded text-[11px] font-bold uppercase tracking-luxury text-white/50 hover:text-white transition-all shadow-soft"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </a>

                    <Link
                        href="/admin/products/catalog"
                        className="flex items-center gap-2 bg-obsidian-light border border-gold/20 px-4 py-3 rounded text-[11px] font-bold uppercase tracking-luxury text-gold hover:bg-gold/10 transition-all shadow-luxury"
                    >
                        <Activity className="w-4 h-4" />
                        Catalog Mode
                    </Link>

                    <BulkImportButton />

                    <Link
                        href="/admin/products/new"
                        className="flex items-center gap-2 bg-gold text-black px-6 py-3 rounded text-[11px] font-bold uppercase tracking-luxury hover:bg-gold-light transition-all shadow-gold"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Product
                    </Link>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: "Total Products", value: totalCount, icon: Package, color: "text-white" },
                    { label: "Active", value: activeCount, icon: Layers, color: "text-emerald-400" },
                    { label: "Low Stock", value: lowStockCount, icon: Activity, color: "text-amber-400" },
                    { label: "Out of Stock", value: outOfStockCount, icon: Trash2, color: "text-red-400" },
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

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {processedProducts.map((product) => (
                    <div key={product.id} className="bg-obsidian border border-luxury-border rounded-luxury p-5 space-y-4 shadow-luxury transition-all hover:border-gold/20">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-black/40 border border-white/10 rounded overflow-hidden shadow-soft flex-shrink-0">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/5">
                                        <Package size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-white text-sm font-serif truncate">{product.title}</p>
                                <p className="text-[9px] text-gold/60 uppercase tracking-widest mt-0.5">{product.categories?.name || 'Unfiltered'}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="space-y-0.5">
                                        <p className="text-white font-serif text-sm">${Number(product.display_price).toFixed(2)}</p>
                                        {product.display_compare && (
                                            <p className="text-gold text-[8px] font-bold tracking-luxury uppercase underline decoration-red-500/50">Was ${Number(product.display_compare).toFixed(2)}</p>
                                        )}
                                    </div>
                                    <form action={async () => { "use server"; await toggleProductStatus(product.id, product.status); }}>
                                        <button className={`transition-all ${product.is_active ? "text-emerald-400" : "text-white/20"}`}>
                                            {product.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] uppercase tracking-luxury text-white/20 font-bold">Reserve:</span>
                                <div className="flex items-center gap-2">
                                    {product.first_variant_id ? (
                                        <>
                                            <form action={async () => { "use server"; await adjustStock(product.first_variant_id, -1); }}>
                                                <button className="w-7 h-7 bg-white/5 border border-white/10 flex items-center justify-center rounded-full hover:border-gold/30 hover:text-gold transition-all text-white/30">
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </form>
                                            <span className={`font-mono text-sm min-w-[20px] text-center ${product.stock === 0 ? "text-red-500 font-bold" : product.stock < 10 ? "text-amber-400 font-bold" : "text-white"}`}>
                                                {product.stock}
                                            </span>
                                            <form action={async () => { "use server"; await adjustStock(product.first_variant_id, 1); }}>
                                                <button className="w-7 h-7 bg-white/5 border border-white/10 flex items-center justify-center rounded-full hover:border-gold/30 hover:text-gold transition-all text-white/30">
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <span className="text-white/10 italic text-[9px]">Static</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <Link href={`/admin/products/${product.id}`} className="h-9 px-4 flex items-center gap-2 border border-white/5 hover:border-gold/30 hover:text-gold transition-all text-white/30 rounded text-[9px] uppercase font-bold tracking-luxury">
                                    <Edit size={12} />
                                    Edit
                                </Link>
                                <form action={async () => { "use server"; await deleteProduct(product.id); }}>
                                    <button className="h-9 w-9 flex items-center justify-center border border-white/5 hover:border-red-500/30 hover:text-red-400 transition-all text-white/30 rounded">
                                        <Trash2 size={12} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-obsidian border border-luxury-border rounded-luxury overflow-hidden">
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
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-white/30 truncate tracking-luxury uppercase font-mono">{product.sku || 'No SKU'}</p>
                                                    <span className="text-[10px] text-white/10 italic">·</span>
                                                    <p className="text-[10px] text-white/30 truncate tracking-luxury uppercase">{product.slug}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase tracking-widest text-gold/60 block">
                                                {product.categories?.name || 'Unfiltered'}
                                            </span>
                                            <span className="text-[9px] uppercase tracking-luxury text-white/20">
                                                Origin: {product.country_of_origin || 'US'}
                                            </span>
                                        </div>
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
                                                            <ChevronDown className="w-3 h-3" />
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
        </div >
    );
}
