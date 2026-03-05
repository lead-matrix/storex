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
    title: string
    variant_type?: string
    sku?: string
    price: number
    compare_price: number | null
    stock: number
    _isNew?: boolean
    _deleted?: boolean
}

interface ProductFormProps {
    product?: {
        id?: string
        title?: string
        slug?: string
        description?: string
        base_price?: number
        sale_price?: number | null
        images?: string[]
        is_featured?: boolean
        is_bestseller?: boolean
        is_new?: boolean
        category_id?: string
        status?: string
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
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
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
            title: '',
            price: 0,
            compare_price: null,
            stock: 0,
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
            // Explicitly sync images and variants
            formData.set('images', images.join(','));
            formData.set('variants', JSON.stringify(variants));

            // Ensure booleans are always sent as strings to avoid browser checkbox omission
            const booleans = ['is_active', 'is_featured', 'is_bestseller', 'is_new', 'on_sale']
            booleans.forEach(key => {
                const element = document.getElementsByName(key)[0] as HTMLInputElement
                if (element) {
                    // Radix switches use a hidden input or the button state
                    // We check if the key is present in the original formData first
                    if (!formData.has(key)) {
                        formData.set(key, 'false')
                    } else {
                        // If it's present but Radix sends 'on', we keep it as is
                        // Our backend handles both 'on' and 'true'
                    }
                }
            })

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
        <form
            onSubmit={(e) => {
                e.preventDefault()
                handleSubmit(new FormData(e.currentTarget))
            }}
            className="space-y-10"
        >

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
                            Product Title *
                        </Label>
                        <Input
                            name="title"
                            defaultValue={product?.title}
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

                    {/* Stock (Base) */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-textsoft">
                            Initial Stock *
                        </Label>
                        <Input
                            name="stock"
                            type="number"
                            min="0"
                            placeholder="50"
                            defaultValue={0}
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
                            <select
                                name="status"
                                defaultValue={product?.status || 'active'}
                                className="bg-pearl border border-charcoal/10 rounded px-2 py-1 text-[10px] uppercase tracking-luxury font-bold outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                            <Label className="text-[10px] uppercase tracking-luxury text-textsoft font-medium">
                                Visibility Status
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
                                    {/* Title */}
                                    <div className="col-span-4 space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Variant Title</label>
                                        <Input
                                            value={variant.title}
                                            onChange={e => updateVariant(index, 'title', e.target.value)}
                                            placeholder="e.g. Ruby Red"
                                            className="h-9 bg-white border-charcoal/10 text-charcoal text-xs"
                                        />
                                    </div>

                                    {/* SKU */}
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">SKU</label>
                                        <Input
                                            value={variant.sku || ''}
                                            onChange={e => updateVariant(index, 'sku', e.target.value)}
                                            placeholder="SKU-001"
                                            className="h-9 bg-white border-charcoal/10 text-charcoal text-xs"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Price ($)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={variant.price}
                                            onChange={e => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
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
