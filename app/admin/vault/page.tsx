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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-serif tracking-widest text-white/80 uppercase">Inventory Vault</h1>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mt-0.5">High-density cross-variant stock management</p>
                </div>
                <Link href="/admin/products/new" id="vault-new-product"
                    className="bg-[#D4AF37]/90 hover:bg-[#D4AF37] text-black px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-colors min-h-[44px] flex items-center">
                    + New Product
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Variants', value: rows.length, color: 'text-white/80' },
                    { label: 'Total Units', value: totalUnits.toLocaleString(), color: 'text-[#D4AF37]' },
                    { label: 'Low Stock', value: lowStock, color: 'text-amber-400' },
                    { label: 'Out of Stock', value: outOfStock, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="glass p-5">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-white/28 mb-2">{s.label}</p>
                        <p className={`text-3xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="glass overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D4AF37]/12 flex items-center justify-between">
                    <h2 className="text-[11px] uppercase tracking-widest text-white/45 font-semibold">
                        All Variants — {rows.length} Records
                    </h2>
                </div>
                {rows.length === 0 ? (
                    <div className="text-center py-20 text-white/20 text-[10px] uppercase tracking-widest">
                        No variants found. Add products with variants first.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full vault-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Product</th>
                                    <th className="text-left">Variant</th>
                                    <th className="text-left">SKU</th>
                                    <th className="text-right">Price</th>
                                    <th className="text-right">Stock</th>
                                    <th className="text-right">Status</th>
                                    <th className="text-right">Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(v => {
                                    const price = v.price_override ?? v.products?.price ?? 0
                                    const s = v.stock_quantity === 0
                                        ? { l: 'Out', c: 'text-red-400 bg-red-500/8 border-red-500/20' }
                                        : v.stock_quantity < 5
                                            ? { l: 'Low', c: 'text-amber-400 bg-amber-500/8 border-amber-500/20' }
                                            : { l: 'OK', c: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20' }
                                    return (
                                        <tr key={v.id}>
                                            <td>
                                                <Link href={`/admin/products/${v.product_id}`}
                                                    className="text-white/65 hover:text-[#D4AF37] transition-colors font-serif">
                                                    {v.products?.name ?? '—'}
                                                </Link>
                                            </td>
                                            <td className="font-light">{v.name}</td>
                                            <td className="font-mono text-white/30 text-[10px]">{v.sku ?? '—'}</td>
                                            <td className="text-right font-mono">
                                                <span className={v.price_override ? 'text-[#D4AF37]' : 'text-white/35'}>${price.toFixed(2)}</span>
                                            </td>
                                            <td className="text-right font-mono">
                                                <span className={v.stock_quantity === 0 ? 'text-red-400' : v.stock_quantity < 5 ? 'text-amber-400' : 'text-white/55'}>
                                                    {v.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span className={`px-2 py-0.5 border rounded-sm text-[8px] uppercase tracking-widest ${s.c}`}>{s.l}</span>
                                            </td>
                                            <td className="text-right">
                                                <Link href={`/admin/products/${v.product_id}`} id={`vault-edit-${v.id}`}
                                                    className="text-[10px] uppercase tracking-widest text-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors">
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
