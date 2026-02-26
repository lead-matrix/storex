import { createClient } from "@/utils/supabase/server";
import { createProduct, deleteProduct } from "./actions";
import { Package, Plus, Trash2, DollarSign, Database } from "lucide-react";

export default async function AdminProductsPage() {
    const supabase = await createClient();

    const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-12 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Merchandise</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Inventory Portfolio</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Create Form */}
                <div className="lg:col-span-1">
                    <section className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-8 space-y-6 sticky top-24 transition-all hover:shadow-luxury">
                        <h2 className="text-[10px] uppercase tracking-luxury text-textsoft font-bold border-b border-charcoal/5 pb-4">New Acquisition</h2>

                        <form action={createProduct} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-bold">Product Name</label>
                                <input
                                    name="name"
                                    placeholder="The Obsidian Essence"
                                    required
                                    className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-textsoft/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-bold">Price ($)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-textsoft/70" />
                                        <input
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            placeholder="149.00"
                                            required
                                            className="w-full bg-pearl border border-charcoal/10 rounded-md pl-10 pr-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-textsoft/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-bold">Initial Stock</label>
                                    <div className="relative">
                                        <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-textsoft/70" />
                                        <input
                                            name="stock"
                                            type="number"
                                            placeholder="50"
                                            required
                                            className="w-full bg-pearl border border-charcoal/10 rounded-md pl-10 pr-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-textsoft/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-bold">Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Optional details..."
                                    className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all h-24 resize-none placeholder:text-textsoft/50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-charcoal text-pearl py-4 text-[11px] font-medium uppercase tracking-luxury flex items-center justify-center gap-2 hover:bg-gold transition-all rounded-full shadow-soft hover:shadow-luxury"
                            >
                                <Plus className="w-4 h-4" />
                                Register Product
                            </button>
                        </form>
                    </section>
                </div>

                {/* Product List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-luxury shadow-soft border border-charcoal/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-charcoal/5 bg-pearl/30 text-[10px] uppercase tracking-luxury text-textsoft">
                                        <th className="px-8 py-5 font-bold">Item</th>
                                        <th className="px-8 py-5 font-bold text-right">Valuation</th>
                                        <th className="px-8 py-5 font-bold text-center">Unit Count</th>
                                        <th className="px-8 py-5 font-bold text-right">Management</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] text-textsoft font-medium">
                                    {products?.map((product) => (
                                        <tr key={product.id} className="border-b border-charcoal/5 hover:bg-gold/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-pearl border border-charcoal/10 rounded-md flex items-center justify-center text-textsoft group-hover:border-gold/30 transition-colors">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-charcoal font-medium text-sm tracking-wide group-hover:text-gold transition-colors">{product.name}</p>
                                                        <p className="text-[9px] text-textsoft/70 font-mono mt-0.5">#{product.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right text-charcoal font-heading text-sm">
                                                ${Number(product.price).toFixed(2)}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-medium tracking-luxury border ${product.stock < 10 ? 'border-red-200 text-red-600 bg-red-50' : 'border-charcoal/10 text-charcoal bg-pearl'
                                                    }`}>
                                                    {product.stock} units
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <form action={async () => {
                                                    "use server";
                                                    await deleteProduct(product.id);
                                                }}>
                                                    <button
                                                        type="submit"
                                                        className="text-textsoft hover:text-red-500 transition-colors inline-flex items-center gap-2 group/btn p-2"
                                                    >
                                                        <span className="text-[9px] uppercase tracking-luxury opacity-0 group-hover/btn:opacity-100 transition-opacity font-medium">Remove</span>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!products || products.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-24 text-center text-textsoft uppercase text-[10px] tracking-luxury">
                                                The collection is currently vacant
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
