'use client'

import { useState, useMemo } from 'react'
import { Save, Search, Filter, Loader2, AlertCircle } from 'lucide-react'
import { bulkUpdateCatalog } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CatalogSpreadsheetProps {
    initialProducts: any[]
}

export function CatalogSpreadsheet({ initialProducts }: CatalogSpreadsheetProps) {
    const [products, setProducts] = useState(initialProducts)
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [isSaving, setIsSaving] = useState(false)
    const [dirtyRows, setDirtyRows] = useState<Record<string, { type: 'product' | 'variant', updates: any }>>({})
    const router = useRouter()

    const categories = useMemo(() => {
        const cats = new Set(initialProducts.map(p => p.categories?.name).filter(Boolean))
        return ['all', ...Array.from(cats)]
    }, [initialProducts])

    // Flatten for spreadsheet view
    const rows = useMemo(() => {
        const allRows: any[] = []
        products.forEach(p => {
            const productMatch =
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.slug.toLowerCase().includes(search.toLowerCase())

            const categoryMatch = selectedCategory === 'all' || p.categories?.name === selectedCategory

            if (p.variants && p.variants.length > 0) {
                p.variants.forEach((v: any) => {
                    const variantMatch = v.name?.toLowerCase().includes(search.toLowerCase()) || v.sku?.toLowerCase().includes(search.toLowerCase())
                    if ((productMatch || variantMatch) && categoryMatch) {
                        allRows.push({
                            id: v.id,
                            parentId: p.id,
                            type: 'variant',
                            productTitle: p.title,
                            name: v.name,
                            sku: v.sku,
                            price: v.price_override ?? p.base_price,
                            stock: v.stock,
                            status: v.status || p.status,
                            image: v.image_url || p.images?.[0]
                        })
                    }
                })
            } else {
                if (productMatch && categoryMatch) {
                    allRows.push({
                        id: p.id,
                        type: 'product',
                        productTitle: p.title,
                        name: 'Base Product',
                        sku: p.slug,
                        price: p.base_price,
                        stock: p.stock,
                        status: p.status,
                        image: p.images?.[0]
                    })
                }
            }
        })
        return allRows
    }, [products, search, selectedCategory])

    const handleUpdate = (id: string, type: 'product' | 'variant', field: string, value: any) => {
        setDirtyRows(prev => {
            const row = prev[id] || { type, updates: {} }
            return {
                ...prev,
                [id]: {
                    ...row,
                    updates: { ...row.updates, [field]: value }
                }
            }
        })

        // Update local state for immediate feedback
        setProducts(prev => {
            return prev.map(p => {
                if (type === 'product' && p.id === id) {
                    return { ...p, [field]: value }
                }
                if (type === 'variant' && p.variants) {
                    return {
                        ...p,
                        variants: p.variants.map((v: any) => v.id === id ? { ...v, [field === 'price' ? 'price_override' : field]: value } : v)
                    }
                }
                return p
            })
        })
    }

    const hasChanges = Object.keys(dirtyRows).length > 0

    const handleSave = async () => {
        if (!hasChanges) return
        setIsSaving(true)
        const toastId = toast.loading("Syncing master catalog...")

        try {
            const updates = {
                products: Object.entries(dirtyRows)
                    .filter(([_, data]) => data.type === 'product')
                    .map(([id, data]) => ({ id, updates: data.updates })),
                variants: Object.entries(dirtyRows)
                    .filter(([_, data]) => data.type === 'variant')
                    .map(([id, data]) => ({ id, updates: data.updates }))
            }

            await bulkUpdateCatalog(updates)
            setDirtyRows({})
            toast.success("Catalog synced successfully", { id: toastId })
            router.refresh()
        } catch (err: any) {
            toast.error(err.message, { id: toastId })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-obsidian/50 p-6 rounded-luxury border border-luxury-border">
                <div className="flex flex-1 items-center gap-4 max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search assets, SKUs, or identifiers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-10 pr-4 text-[11px] uppercase tracking-luxury text-white placeholder:text-white/20 focus:border-gold/50 transition-all outline-none"
                        />
                    </div>
                    <div className="relative w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold/40" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-[10px] uppercase tracking-luxury text-white/60 appearance-none outline-none focus:border-gold/30"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`
                        flex items-center gap-2 px-8 py-3 rounded text-[11px] font-bold uppercase tracking-luxury transition-all
                        ${hasChanges
                            ? "bg-gold text-black shadow-gold hover:bg-gold-light"
                            : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"}
                    `}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? "Syncing..." : "Commit Changes"}
                </button>
            </div>

            <div className="bg-obsidian border border-luxury-border rounded-luxury overflow-hidden shadow-luxury">
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-white/5 bg-black/80 backdrop-blur-md text-[10px] uppercase tracking-luxury text-gold font-bold">
                                <th className="px-6 py-4 border-r border-white/5">Asset</th>
                                <th className="px-6 py-4 border-r border-white/5">Identifier (SKU)</th>
                                <th className="px-6 py-4 border-r border-white/5 text-center">Valuation ($)</th>
                                <th className="px-6 py-4 border-r border-white/5 text-center">Reserve</th>
                                <th className="px-6 py-4 text-center">State</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-white/60 font-medium divide-y divide-white/5">
                            {rows.map((row) => (
                                <tr key={row.id} className={`hover:bg-white/5 transition-colors group ${dirtyRows[row.id] ? 'bg-gold/5' : ''}`}>
                                    <td className="px-6 py-4 border-r border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-black/40 border border-white/5 overflow-hidden flex-shrink-0">
                                                <img src={row.image} alt="" className="w-full h-full object-cover opacity-60" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white truncate max-w-[150px]">{row.productTitle}</p>
                                                <p className="text-[9px] text-white/30 uppercase tracking-widest truncate max-w-[150px]">{row.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-r border-white/5 font-mono text-[10px] text-white/40 group-hover:text-gold transition-colors">
                                        {row.sku || 'UNASSIGNED'}
                                    </td>
                                    <td className="px-6 py-4 border-r border-white/5">
                                        <div className="flex justify-center">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={dirtyRows[row.id]?.updates.price ?? (dirtyRows[row.id]?.updates.price_override ?? row.price)}
                                                onChange={(e) => handleUpdate(row.id, row.type, row.type === 'variant' ? 'price_override' : 'base_price', parseFloat(e.target.value))}
                                                className="w-24 bg-black/20 border border-white/5 rounded px-2 py-1 text-center font-serif text-white hover:border-gold/30 focus:border-gold outline-none transition-all"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-r border-white/5">
                                        <div className="flex justify-center">
                                            <input
                                                type="number"
                                                value={dirtyRows[row.id]?.updates.stock ?? row.stock}
                                                onChange={(e) => handleUpdate(row.id, row.type, 'stock', parseInt(e.target.value))}
                                                className={`w-20 bg-black/20 border border-white/5 rounded px-2 py-1 text-center font-mono hover:border-gold/30 focus:border-gold outline-none transition-all ${row.stock < 10 ? 'text-amber-400' : 'text-white'}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <select
                                                value={dirtyRows[row.id]?.updates.status ?? row.status}
                                                onChange={(e) => handleUpdate(row.id, row.type, 'status', e.target.value)}
                                                className={`
                                                    bg-black/20 border border-white/5 rounded px-3 py-1 text-[9px] uppercase tracking-luxury transition-all outline-none
                                                    ${(dirtyRows[row.id]?.updates.status ?? row.status) === 'active' ? 'text-emerald-400 border-emerald-400/20' : 'text-white/30'}
                                                `}
                                            >
                                                <option value="active">Active</option>
                                                <option value="draft">Draft</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                            <AlertCircle size={40} strokeWidth={1} />
                                            <p className="uppercase tracking-widest text-[11px] font-bold">No assets match your current filter</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-white/20 px-2">
                <p>Showing {rows.length} artifacts in master catalog</p>
                {hasChanges && (
                    <p className="text-gold animate-pulse">You have {Object.keys(dirtyRows).length} unsynced changes in the buffer</p>
                )}
            </div>
        </div>
    )
}
