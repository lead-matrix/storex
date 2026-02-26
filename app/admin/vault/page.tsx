import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Inventory Vault | Admin' }

type VRow = {
    id: string; name: string; price_override: number | null
    stock_quantity: number; sku: string | null; product_id: string
    products: { name: string; price: number } | null
}

export default async function VaultPage() {
    const supabase = await createClient()
    const { data: raw } = await supabase
        .from('variants')
        .select('id, name, price_override, stock_quantity, sku, product_id, products(name, price)')
        .order('product_id')
        .limit(300)

    const rows = (raw ?? []) as unknown as VRow[]
    const totalUnits = rows.reduce((s, v) => s + v.stock_quantity, 0)
    const outOfStock = rows.filter(v => v.stock_quantity === 0).length
    const lowStock = rows.filter(v => v.stock_quantity > 0 && v.stock_quantity < 5).length

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-luxury-fade">
            {/* Header */}
            <div className="flex items-center justify-between mt-8">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Inventory Vault</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">High-density cross-variant stock management</p>
                </div>
                <Link href="/admin/products/new" id="vault-new-product"
                    className="bg-charcoal text-pearl px-6 py-3 rounded-full text-[11px] font-medium uppercase tracking-luxury transition-all shadow-soft hover:shadow-luxury hover:bg-gold flex items-center">
                    + New Product
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Variants', value: rows.length, color: 'text-charcoal' },
                    { label: 'Total Units', value: totalUnits.toLocaleString(), color: 'text-gold' },
                    { label: 'Low Stock', value: lowStock, color: 'text-amber-600' },
                    { label: 'Out of Stock', value: outOfStock, color: 'text-red-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-5 hover:shadow-luxury transition-shadow">
                        <p className="text-[9px] uppercase tracking-luxury font-medium text-textsoft mb-2">{s.label}</p>
                        <p className={`text-3xl font-heading ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-luxury shadow-soft border border-charcoal/10 overflow-hidden">
                <div className="px-6 py-5 border-b border-charcoal/5 bg-pearl/30 flex items-center justify-between">
                    <h2 className="text-[11px] uppercase tracking-luxury text-charcoal font-medium">
                        All Variants — {rows.length} Records
                    </h2>
                </div>
                {rows.length === 0 ? (
                    <div className="text-center py-20 text-textsoft text-[10px] uppercase tracking-luxury">
                        No variants found. Add products with variants first.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-charcoal/5 text-[10px] uppercase tracking-luxury text-textsoft font-bold bg-pearl/10">
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Variant</th>
                                    <th className="px-6 py-4">SKU</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                    <th className="px-6 py-4 text-right">Stock</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                    <th className="px-6 py-4 text-right">Edit</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] text-textsoft font-medium">
                                {rows.map(v => {
                                    const price = v.price_override ?? v.products?.price ?? 0
                                    const s = v.stock_quantity === 0
                                        ? { l: 'Out', c: 'text-red-700 bg-red-50 border-red-200' }
                                        : v.stock_quantity < 5
                                            ? { l: 'Low', c: 'text-amber-700 bg-amber-50 border-amber-200' }
                                            : { l: 'OK', c: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
                                    return (
                                        <tr key={v.id} className="border-b border-charcoal/5 hover:bg-gold/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <Link href={`/admin/products/${v.product_id}`}
                                                    className="text-charcoal font-heading hover:text-gold transition-colors text-sm">
                                                    {v.products?.name ?? '—'}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{v.name}</td>
                                            <td className="px-6 py-4 font-mono text-textsoft/70 text-[10px]">{v.sku ?? '—'}</td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                <span className={v.price_override ? 'text-gold font-bold' : 'text-textsoft'}>${price.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                <span className={v.stock_quantity === 0 ? 'text-red-600 font-bold' : v.stock_quantity < 5 ? 'text-amber-600 font-bold' : 'text-charcoal'}>
                                                    {v.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-0.5 border rounded-full text-[8px] uppercase tracking-luxury font-medium inline-block w-12 text-center ${s.c}`}>{s.l}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/admin/products/${v.product_id}`} id={`vault-edit-${v.id}`}
                                                    className="text-[10px] uppercase tracking-luxury text-textsoft/70 hover:text-gold transition-colors font-semibold group-hover:text-gold">
                                                    Edit →
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
