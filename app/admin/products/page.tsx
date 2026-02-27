import { createClient } from "@/utils/supabase/server";
import { createProduct, deleteProduct } from "./actions";
import { Package, Plus, Trash2, DollarSign, Database, Tag, Star } from "lucide-react";

export default async function AdminProductsPage() {
    const supabase = await createClient();

    const { data: products } = await supabase
        .from("products")
        .select(`
            *,
            categories(name)
        `)
        .order("created_at", { ascending: false });

    const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true);

    return (
        <div className="space-y-12 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury font-serif uppercase">Merchandise</h1>
                    <p className="text-textsoft text-[10px] uppercase tracking-luxury font-bold text-gold">The Obsidian Collection Portfolio</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Create Form */}
                <div className="lg:col-span-1">
                    <section className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-8 space-y-6 sticky top-24 transition-all hover:border-gold/30">
                        <h2 className="text-[10px] uppercase tracking-luxury text-gold font-bold border-b border-white/5 pb-4">New Acquisition</h2>

                        <form action={createProduct} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Product Name</label>
                                <input
                                    name="name"
                                    placeholder="e.g. Midnight Silk Foundation"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-md px-6 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all placeholder:text-white/20 font-light"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Base Valuation ($)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gold" />
                                        <input
                                            name="base_price"
                                            type="number"
                                            step="0.01"
                                            placeholder="49.00"
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-md pl-10 pr-6 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all placeholder:text-white/20 font-light"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Initial Stock</label>
                                    <div className="relative">
                                        <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gold" />
                                        <input
                                            name="stock"
                                            type="number"
                                            placeholder="100"
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-md pl-10 pr-6 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all placeholder:text-white/20 font-light"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-white/50 font-bold">Category</label>
                                <div className="relative font-light text-sm">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gold" />
                                    <select
                                        name="category_id"
                                        className="w-full bg-black/40 border border-white/10 rounded-md pl-10 pr-6 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Uncategorized</option>
                                        {categories?.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="bg-obsidian text-white">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    name="is_featured"
                                    value="true"
                                    id="is_featured"
                                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-gold focus:ring-gold/50"
                                />
                                <label htmlFor="is_featured" className="text-[10px] uppercase tracking-widest text-white/60 font-medium">Highlight in Showroom</label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gold text-black py-4 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold-light transition-all rounded-md shadow-gold"
                            >
                                <Package className="w-4 h-4" />
                                Register Asset
                            </button>
                        </form>
                    </section>
                </div>

                {/* Product List */}
                <div className="lg:col-span-2">
                    <div className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-luxury text-gold font-bold">
                                        <th className="px-8 py-5">Product Name</th>
                                        <th className="px-8 py-5">Category</th>
                                        <th className="px-8 py-5 text-right">Valuation</th>
                                        <th className="px-8 py-5 text-center">In-Stock</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] text-white/60 font-medium">
                                    {products?.map((product) => (
                                        <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-black/40 border border-white/10 rounded-md flex items-center justify-center text-gold group-hover:border-gold/30 transition-colors">
                                                        {product.is_featured ? <Star className="w-4 h-4 fill-gold" /> : <Package className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium text-sm tracking-wide group-hover:text-gold transition-colors">{product.name}</p>
                                                        <p className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-widest">{product.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40">
                                                    {(product.categories as any)?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right text-white font-serif text-sm">
                                                ${Number(product.base_price).toFixed(2)}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-3 py-1 rounded text-[9px] font-bold tracking-widest border ${product.stock < 10 ? 'border-red-900/50 text-red-500 bg-red-950/20' : 'border-gold/20 text-gold bg-gold/5'
                                                    }`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <form action={async (formData) => {
                                                    "use server";
                                                    await deleteProduct(product.id);
                                                }}>
                                                    <button
                                                        type="submit"
                                                        className="text-white/20 hover:text-red-500 transition-colors inline-flex items-center gap-2 group/btn p-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!products || products.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-24 text-center text-white/20 uppercase text-[10px] tracking-[0.5em] font-light italic">
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
