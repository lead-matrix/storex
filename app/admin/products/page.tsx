import { createClient } from "@/utils/supabase/server";
import { createProduct, deleteProduct, adjustStock, toggleProductStatus } from "@/lib/actions/admin";
import { Package, Plus, Trash2, DollarSign, Database, Tag, Star, Pencil, ChevronUp, ChevronDown, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products | Admin" };

export default async function AdminProductsPage() {
    const supabase = await createClient();

    const { data: products } = await supabase
        .from("products")
        .select(`*, categories(name)`)
        .order("created_at", { ascending: false });

    const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true);

    const totalProducts = products?.length ?? 0;
    const activeProducts = products?.filter((p) => p.is_active).length ?? 0;
    const lowStock = products?.filter((p) => (p.stock ?? 0) < 10).length ?? 0;
    const outOfStock = products?.filter((p) => (p.stock ?? 0) === 0).length ?? 0;

    return (
        <div className="space-y-12 animate-luxury-fade pb-24">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase">Merchandise</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">The Obsidian Collection Portfolio</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="bg-gold text-black px-8 py-3 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gold-light transition-all shadow-gold"
                >
                    <Plus className="w-4 h-4" />
                    New Product
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: "Total Products", value: totalProducts, color: "text-white", icon: Package },
                    { label: "Active", value: activeProducts, color: "text-emerald-400", icon: Package },
                    { label: "Low Stock (<10)", value: lowStock, color: "text-amber-400", icon: AlertTriangle },
                    { label: "Out of Stock", value: outOfStock, color: "text-red-500", icon: AlertTriangle },
                ].map((s) => (
                    <div key={s.label} className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-6 hover:border-gold/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] uppercase tracking-luxury font-bold text-white/30">{s.label}</p>
                            <s.icon className={`w-4 h-4 ${s.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <p className={`text-4xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Quick-Add Form */}
                <div className="lg:col-span-1">
                    <section className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-8 space-y-6 sticky top-24 transition-all hover:border-gold/30">
                        <h2 className="text-[10px] uppercase tracking-luxury text-gold font-bold border-b border-white/5 pb-4">Quick Add</h2>

                        <form action={createProduct} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Product Name</label>
                                <input
                                    name="name"
                                    placeholder="e.g. Midnight Silk Foundation"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all placeholder:text-white/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Price ($)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold" />
                                        <input name="base_price" type="number" step="0.01" placeholder="49.00" required
                                            className="w-full bg-black/40 border border-white/10 rounded pl-8 pr-3 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Stock</label>
                                    <div className="relative">
                                        <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold" />
                                        <input name="stock" type="number" placeholder="100" required
                                            className="w-full bg-black/40 border border-white/10 rounded pl-8 pr-3 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Category</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold" />
                                    <select name="category_id"
                                        className="w-full bg-black/40 border border-white/10 rounded pl-8 pr-3 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all appearance-none">
                                        <option value="">Uncategorized</option>
                                        {categories?.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="bg-obsidian">{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-1">
                                <input type="checkbox" name="is_featured" value="true" id="is_featured"
                                    className="w-4 h-4 border-white/10 bg-black/40 text-gold" />
                                <label htmlFor="is_featured" className="text-[10px] uppercase tracking-luxury text-white/60 font-medium">⭐ Featured</label>
                            </div>

                            <button type="submit"
                                className="w-full bg-gold text-black py-3.5 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold-light transition-all rounded shadow-gold">
                                <Package className="w-4 h-4" />
                                Register Asset
                            </button>
                        </form>

                        <p className="text-[9px] text-white/20 uppercase tracking-luxury text-center border-t border-white/5 pt-4">
                            For full editing including images, variants, & sale price →{" "}
                            <Link href="/admin/products/new" className="text-gold hover:underline">Full Editor</Link>
                        </p>
                    </section>
                </div>

                {/* Products Table */}
                <div className="lg:col-span-2">
                    <div className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-luxury text-gold font-bold">
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4 text-right">Price</th>
                                        <th className="px-6 py-4 text-center">Stock</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] text-white/60 font-medium">
                                    {products?.map((product) => (
                                        <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-black/40 border border-white/10 rounded flex items-center justify-center text-gold group-hover:border-gold/30 transition-colors shrink-0">
                                                        {product.is_featured ? <Star className="w-4 h-4 fill-gold text-gold" /> : <Package className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium text-sm group-hover:text-gold transition-colors">{product.name}</p>
                                                        <p className="text-[9px] text-white/25 font-mono uppercase tracking-widest mt-0.5">{product.slug}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40">
                                                    {(() => {
                                                        const cat = product.categories;
                                                        if (Array.isArray(cat)) return cat[0]?.name || "—";
                                                        return (cat as any)?.name || "—";
                                                    })()}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    {product.on_sale && product.sale_price ? (
                                                        <>
                                                            <span className="text-sm font-serif text-red-400">${Number(product.sale_price).toFixed(2)}</span>
                                                            <span className="text-[9px] text-white/30 line-through">${Number(product.base_price).toFixed(2)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm font-serif text-white">${Number(product.base_price).toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Stock + Adjustment */}
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <form action={async (fd) => {
                                                        "use server";
                                                        await adjustStock(product.id, -1);
                                                    }}>
                                                        <button type="submit" className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-950/50 hover:text-red-400 transition-colors text-white/30" title="Remove 1">
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    </form>
                                                    <span className={`font-mono text-sm min-w-[28px] text-center ${product.stock === 0 ? "text-red-500 font-bold" : product.stock < 10 ? "text-amber-400 font-bold" : "text-white"}`}>
                                                        {product.stock ?? 0}
                                                    </span>
                                                    <form action={async (fd) => {
                                                        "use server";
                                                        await adjustStock(product.id, 1);
                                                    }}>
                                                        <button type="submit" className="w-6 h-6 flex items-center justify-center rounded hover:bg-emerald-950/50 hover:text-emerald-400 transition-colors text-white/30" title="Add 1">
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>

                                            {/* Active / Inactive Toggle */}
                                            <td className="px-6 py-5 text-center">
                                                <form action={async () => {
                                                    "use server";
                                                    await toggleProductStatus(product.id, product.is_active);
                                                }}>
                                                    <button type="submit" title={product.is_active ? "Deactivate" : "Activate"}
                                                        className={`flex items-center justify-center mx-auto transition-colors ${product.is_active ? "text-emerald-400 hover:text-red-400" : "text-red-500 hover:text-emerald-400"}`}>
                                                        {product.is_active
                                                            ? <ToggleRight className="w-5 h-5" />
                                                            : <ToggleLeft className="w-5 h-5" />
                                                        }
                                                    </button>
                                                </form>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin/products/${product.id}`}
                                                        className="text-white/30 hover:text-gold transition-colors p-1.5 rounded hover:bg-gold/10">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <form action={async () => {
                                                        "use server";
                                                        await deleteProduct(product.id);
                                                    }}>
                                                        <button type="submit" className="text-white/20 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-950/30">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!products || products.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center text-white/20 uppercase text-[10px] tracking-luxury italic">
                                                The Obsidian Vault is currently vacant
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
