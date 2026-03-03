'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/lib/actions/admin'
import { ImageUpload } from './ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Category {
    id: string
    name: string
    slug: string
}

interface Variant {
    id?: string
    name: string
    variant_type: 'shade' | 'size' | 'bundle' | 'type'
    color_code?: string
    price_override: number | null
    stock: number
    is_active: boolean
    _isNew?: boolean
    _deleted?: boolean
}

interface ProductFormProps {
    product?: {
        id?: string
        name?: string
        slug?: string
        description?: string
        base_price?: number
        sale_price?: number | null
        on_sale?: boolean
        stock?: number
        images?: string[]
        is_featured?: boolean
        is_bestseller?: boolean
        is_new?: boolean
        category_id?: string
        is_active?: boolean
    }
    variants?: Variant[]
}

const VARIANT_TYPE_OPTIONS: { value: Variant['variant_type']; label: string }[] = [
    { value: 'shade', label: 'Shade' },
    { value: 'size', label: 'Size' },
    { value: 'type', label: 'Type' },
    { value: 'bundle', label: 'Bundle' },
]

export function ProductForm({ product, variants: initialVariants = [] }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [images, setImages] = useState<string[]>(product?.images || [])
    const [categories, setCategories] = useState<Category[]>([])
    const [variants, setVariants] = useState<Variant[]>(initialVariants)
    const [showVariants, setShowVariants] = useState(initialVariants.length > 0)

    // Auto-generate slug from name
    const [slugValue, setSlugValue] = useState(product?.slug ?? '')
    const [slugManual, setSlugManual] = useState(!!product?.slug)

    const generateSlug = useCallback((name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        []
    )

    useEffect(() => {
        const supabase = createClient()
        supabase
            .from('categories')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('name')
            .then(({ data }) => {
                if (data) setCategories(data as Category[])
            })
    }, [])

    function addVariant() {
        setVariants(prev => [...prev, {
            name: '',
            variant_type: 'shade',
            price_override: null,
            stock: 0,
            is_active: true,
            _isNew: true,
        }])
    }

    function updateVariant(index: number, field: keyof Variant, value: Variant[keyof Variant]) {
        setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
    }

    function removeVariant(index: number) {
        setVariants(prev => prev.map((v, i) =>
            i === index ? { ...v, _deleted: true } : v
        ))
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        try {
            formData.set('images', images.join(','))
            formData.set('variants', JSON.stringify(variants.filter(v => !v._deleted)))

            if (product?.id) {
                formData.set('id', product.id)
                await updateProduct(formData)
            } else {
                await createProduct(formData)
            }
            router.push('/admin/products')
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred while saving.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const visibleVariants = variants.filter(v => !v._deleted)

    return (
        <form action={handleSubmit} className="space-y-10">

            {/* Error Banner */}
            {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 text-sm rounded-md">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* LEFT COLUMN */}
                <div className="space-y-6">

                    {/* Product Name */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Product Name *
                        </Label>
                        <Input
                            name="name"
                            defaultValue={product?.name}
                            placeholder="e.g. Obsidian Foundation"
                            required
                            className="bg-pearl border-charcoal/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-charcoal placeholder:text-textsoft/50 h-12"
                            onChange={e => {
                                if (!slugManual) setSlugValue(generateSlug(e.target.value))
                            }}
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            URL Slug *
                        </Label>
                        <Input
                            name="slug"
                            value={slugValue}
                            placeholder="e.g. obsidian-foundation"
                            required
                            className="bg-pearl border-charcoal/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-charcoal placeholder:text-textsoft/50 h-12 font-mono text-xs"
                            onChange={e => {
                                setSlugManual(true)
                                setSlugValue(generateSlug(e.target.value))
                            }}
                        />
                        <p className="text-[10px] text-textsoft/50 tracking-luxury">Used in /product/[slug] — auto-generated from name</p>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Base Price (USD) *
                        </Label>
                        <Input
                            name="base_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            defaultValue={product?.base_price}
                            required
                            className="bg-pearl border-charcoal/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-charcoal placeholder:text-textsoft/50 h-12"
                        />
                        <p className="text-[10px] text-textsoft/50 tracking-luxury">Variants may override this price</p>
                    </div>

                    {/* Stock */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Base Stock Quantity *
                        </Label>
                        <Input
                            name="stock"
                            type="number"
                            min="0"
                            placeholder="50"
                            defaultValue={product?.stock ?? 0}
                            required
                            className="bg-pearl border-charcoal/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-charcoal placeholder:text-textsoft/50 h-12"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Category *
                        </Label>
                        <div className="relative">
                            <select
                                name="category_id"
                                defaultValue={product?.category_id ?? ''}
                                className="w-full h-12 bg-pearl rounded-md border border-charcoal/10 px-4 pr-10 text-sm text-charcoal focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors appearance-none"
                            >
                                <option value="">— Select Category —</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textsoft pointer-events-none" />
                        </div>
                        {categories.length === 0 && (
                            <p className="text-[10px] text-textsoft/60 tracking-luxury">
                                No active categories — create them in /admin/categories
                            </p>
                        )}
                    </div>

                    {/* Sale Price */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Sale Price (USD) — leave blank if not on sale
                        </Label>
                        <Input
                            name="sale_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 9.99"
                            defaultValue={product?.sale_price ?? ''}
                            className="bg-pearl border-charcoal/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-charcoal placeholder:text-textsoft/50 h-12"
                        />
                        <p className="text-[10px] text-textsoft/50 tracking-luxury">Set a sale price and toggle On Sale to activate the discount</p>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="on_sale"
                                name="on_sale"
                                defaultChecked={product?.on_sale}
                            />
                            <Label htmlFor="on_sale" className="text-[10px] uppercase tracking-luxury text-red-500 cursor-pointer font-medium">
                                🔴 On Sale (shows strikethrough + sale price)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="is_featured"
                                name="is_featured"
                                defaultChecked={product?.is_featured}
                            />
                            <Label htmlFor="is_featured" className="text-[10px] uppercase tracking-luxury text-textsoft cursor-pointer font-medium">
                                ⭐ Featured in Collection
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="is_bestseller"
                                name="is_bestseller"
                                defaultChecked={product?.is_bestseller}
                            />
                            <Label htmlFor="is_bestseller" className="text-[10px] uppercase tracking-luxury text-textsoft cursor-pointer font-medium">
                                🏆 Mark as Bestseller
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="is_new"
                                name="is_new"
                                defaultChecked={product?.is_new}
                            />
                            <Label htmlFor="is_new" className="text-[10px] uppercase tracking-luxury text-textsoft cursor-pointer font-medium">
                                ✨ Mark as New Arrival
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="is_active"
                                name="is_active"
                                defaultChecked={product?.is_active !== false}
                            />
                            <Label htmlFor="is_active" className="text-[10px] uppercase tracking-luxury text-textsoft cursor-pointer font-medium">
                                ✅ Active (visible in store)
                            </Label>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Description *
                        </Label>
                        <Textarea
                            name="description"
                            defaultValue={product?.description}
                            placeholder="Describe the masterpiece..."
                            required
                            className="bg-pearl border-charcoal/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-charcoal placeholder:text-textsoft/50 min-h-[180px] resize-none"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Visual Gallery
                        </Label>
                        <ImageUpload
                            images={images}
                            onImagesChange={setImages}
                            maxImages={10}
                        />
                    </div>
                </div>
            </div>

            {/* VARIANTS SECTION */}
            <div className="border border-charcoal/10 rounded-luxury overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowVariants(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-pearl hover:bg-champagne/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-luxury text-charcoal font-medium">
                            Product Variants
                        </span>
                        {visibleVariants.length > 0 && (
                            <span className="bg-gold text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                {visibleVariants.length}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-textsoft transition-transform ${showVariants ? 'rotate-180' : ''}`}
                    />
                </button>

                {showVariants && (
                    <div className="p-6 space-y-4 bg-white">
                        <p className="text-[10px] text-textsoft/70 uppercase tracking-luxury">
                            Add shade, size, type, or bundle variants. Variant price overrides the base price when selected.
                        </p>

                        {/* Variant Rows */}
                        {variants.map((variant, index) => {
                            if (variant._deleted) return null
                            return (
                                <div
                                    key={index}
                                    className="grid grid-cols-12 gap-3 items-end p-4 bg-pearl rounded-md border border-charcoal/5"
                                >
                                    {/* Name */}
                                    <div className="col-span-3 space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Name</label>
                                        <Input
                                            value={variant.name}
                                            onChange={e => updateVariant(index, 'name', e.target.value)}
                                            placeholder="e.g. Ruby Red"
                                            className="h-9 bg-white border-charcoal/10 text-charcoal text-xs"
                                        />
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Type</label>
                                        <select
                                            value={variant.variant_type}
                                            onChange={e => updateVariant(index, 'variant_type', e.target.value as Variant['variant_type'])}
                                            className="w-full h-9 bg-white border border-charcoal/10 rounded-md px-2 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-gold/50"
                                        >
                                            {VARIANT_TYPE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Color Code (only for shades) */}
                                    {variant.variant_type === 'shade' && (
                                        <div className="col-span-1 space-y-1.5">
                                            <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Color</label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="color"
                                                    value={variant.color_code || '#000000'}
                                                    onChange={e => updateVariant(index, 'color_code', e.target.value)}
                                                    className="h-9 w-9 p-0.5 bg-white border-charcoal/10 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Price Override */}
                                    <div className={variant.variant_type === 'shade' ? "col-span-2 space-y-1.5" : "col-span-3 space-y-1.5"}>
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Price ($)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={variant.price_override ?? ''}
                                            onChange={e => updateVariant(index, 'price_override', e.target.value ? parseFloat(e.target.value) : null)}
                                            placeholder="Base"
                                            className="h-9 bg-white border-charcoal/10 text-charcoal text-xs"
                                        />
                                    </div>

                                    {/* Stock */}
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Stock</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={variant.stock}
                                            onChange={e => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                            className="h-9 bg-white border-charcoal/10 text-charcoal text-xs"
                                        />
                                    </div>

                                    {/* Active */}
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Active</label>
                                        <div className="flex items-center h-9">
                                            <Switch
                                                checked={variant.is_active}
                                                onCheckedChange={v => updateVariant(index, 'is_active', v)}
                                            />
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <div className="col-span-1 flex items-end justify-end pb-0.5">
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            className="p-2 text-textsoft hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        <button
                            type="button"
                            onClick={addVariant}
                            className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-charcoal font-medium border border-dashed border-charcoal/20 rounded-md px-4 py-3 w-full hover:border-gold/50 hover:text-gold hover:bg-gold/5 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Variant
                        </button>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-8 border-t border-charcoal/10">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-charcoal text-pearl rounded-full px-12 py-6 text-[11px] font-medium uppercase tracking-luxury hover:bg-gold transition-all shadow-soft hover:shadow-luxury disabled:opacity-50 min-w-[200px]"
                >
                    {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4 inline" /> : null}
                    {product?.id ? 'Refine Masterpiece' : 'Forge Collection Item'}
                </Button>
            </div>
        </form>
    )
}
