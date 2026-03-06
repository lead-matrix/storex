import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Package, ShieldCheck, AlertTriangle, Box, ChevronRight, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Inventory Vault | Admin' }

type VRow = {
    id: string;
    name: string;
    price_override: number | null;
    stock: number;
    sku: string | null;
    product_id: string;
    products: { name: string; base_price: number } | null
}

export default async function VaultPage() {
    const supabase = await createClient()
    const { data: raw } = await supabase
        .from('variants')
        .select('id, name, price_override, stock, sku, product_id, products(name, base_price)')
        .order('product_id')
        .limit(300)

    const rows = (raw ?? []) as unknown as VRow[]
    const totalUnits = rows.reduce((s, v) => s + (v.stock || 0), 0)
    const outOfStock = rows.filter(v => (v.stock || 0) === 0).length
    const lowStock = rows.filter(v => (v.stock || 0) > 0 && (v.stock || 0) < 5).length

    return (
        <div className="space-y-12 max-w-7xl mx-auto pb-24 animate-luxury-fade">
            {/* Header */}
            <div className="flex items-end justify-between mt-8">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase">Inventory Vault</h1>
                    <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">High-Density Stock Custody</p>
                </div>
                <Link href="/admin/products" id="vault-to-products"
                    className="bg-gold text-black px-8 py-3 rounded text-[11px] font-bold uppercase tracking-widest transition-all shadow-gold hover:bg-gold-light flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Manage Products
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Manifested Variants', value: rows.length, color: 'text-white', icon: Box },
                    { label: 'Total Stock Units', value: totalUnits.toLocaleString(), color: 'text-gold', icon: ShieldCheck },
                    { label: 'Depleted Stock', value: outOfStock, color: 'text-red-500', icon: AlertTriangle },
                    { label: 'Reserve Alert', value: lowStock, color: 'text-amber-500', icon: AlertTriangle },
                ].map(s => (
                    <div key={s.label} className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-6 hover:border-gold/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] uppercase tracking-luxury font-bold text-white/30">{s.label}</p>
                            <s.icon className={`w-4 h-4 ${s.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <p className={`text-4xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">
                        Central Ledger — {rows.length} Records Detected
                    </h2>
                </div>
                {rows.length === 0 ? (
                    <div className="text-center py-32 text-white/20 uppercase text-[10px] tracking-[0.5em] italic font-light">
                        No variant records found in the vault.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/40 font-bold bg-black/20">
                                    <th className="px-8 py-5">Parent Collection</th>
                                    <th className="px-8 py-5">Variant SKU</th>
                                    <th className="px-8 py-5 text-right">Unit Value</th>
                                    <th className="px-8 py-5 text-center">In-Stock</th>
                                    <th className="px-8 py-5 text-center">Security</th>
                                    <th className="px-8 py-5 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] text-white/60 font-medium">
                                {rows.map(v => {
                                    const price = v.price_override ?? v.products?.base_price ?? 0
                                    const stock = v.stock || 0
                                    const s = stock === 0
                                        ? { l: 'DEPLETED', c: 'text-red-500 border-red-900/50 bg-red-950/20' }
                                        : stock < 5
                                            ? { l: 'CRITICAL', c: 'text-amber-500 border-amber-900/50 bg-amber-950/20' }
                                            : { l: 'SECURE', c: 'text-emerald-500 border-emerald-900/50 bg-emerald-950/20' }
                                    return (
                                        <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-serif text-sm group-hover:text-gold transition-colors">{v.products?.name ?? '—'}</span>
                                                    <span className="text-[9px] text-white/20 uppercase tracking-widest mt-1">{v.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-white/40 text-[10px] uppercase tracking-widest">
                                                {v.sku || `V-${v.id.slice(0, 6).toUpperCase()}`}
                                            </td>
                                            <td className="px-8 py-6 text-right font-serif">
                                                <div className="flex items-center justify-end gap-1 text-white">
                                                    <DollarSign className="w-3 h-3 text-gold" />
                                                    <span className={v.price_override ? 'text-gold font-bold' : ''}>{price.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`font-mono text-sm ${stock === 0 ? 'text-red-500 font-bold' : stock < 5 ? 'text-amber-500 font-bold' : 'text-white'}`}>
                                                    {stock}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-3 py-1 border rounded text-[8px] uppercase tracking-[0.2em] font-bold ${s.c}`}>
                                                    {s.l}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link href={`/admin/products`}
                                                    className="text-white/20 hover:text-gold transition-all group-hover:translate-x-1 inline-block">
                                                    <ChevronRight className="w-4 h-4" />
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

