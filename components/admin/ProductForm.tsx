'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/lib/actions/admin'
import { ImageUpload } from './ImageUpload'
import { SingleImageUpload } from './SingleImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Category {
    id: string
    name: string
    slug: string
}

interface Variant {
    id?: string
    title: string
    variant_type: string
    sku?: string
    price: number
    compare_price: number | null
    stock: number
    color_code?: string
    image_url?: string
    weight?: number
    status?: string
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
        on_sale?: boolean
        images?: string[]
        is_featured?: boolean
        is_bestseller?: boolean
        is_new?: boolean
        category_id?: string
        status?: string
        weight_oz?: number | null
        length_in?: number | null
        width_in?: number | null
        height_in?: number | null
        sku?: string | null
        country_of_origin?: string | null
        customs_value_usd?: number | null
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
    const [descCount, setDescCount] = useState((product?.description || '').length)

    // Auto-generate slug from name
    const generateSKU = () => 'DC-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    
    const [skuValue, setSkuValue] = useState(product?.sku || generateSKU())
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
            .eq('status', 'active')
            .order('name')
            .then(({ data }) => {
                if (data) setCategories(data as Category[])
            })
    }, [])

    function addVariant() {
        setVariants(prev => [...prev, {
            title: '',
            variant_type: 'shade',
            price: 0,
            compare_price: null,
            stock: 10,
            color_code: '',
            image_url: '',
            weight: 0.5,
            sku: generateSKU(),
            status: 'active',
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
                toast.success('Product updated successfully!')
            } else {
                await createProduct(formData)
                toast.success('Product created successfully!')
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
                <div className="flex items-start gap-3 bg-red-950/20 border border-red-500/20 text-red-400 px-5 py-4 text-sm rounded-md">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* LEFT COLUMN */}
                <div className="space-y-6">

                    {/* Product Name */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
                            Product Title *
                        </Label>
                        <Input
                            name="title"
                            defaultValue={product?.title}
                            placeholder="e.g. Obsidian Foundation"
                            required
                            className="bg-[#121214] border-white/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-white placeholder:text-luxury-subtext/50 h-12"
                            onChange={e => {
                                if (!slugManual) setSlugValue(generateSlug(e.target.value))
                            }}
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
                            URL Slug *
                        </Label>
                        <Input
                            name="slug"
                            value={slugValue}
                            placeholder="e.g. obsidian-foundation"
                            required
                            className="bg-[#121214] border-white/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-white placeholder:text-luxury-subtext/50 h-12 font-mono text-xs"
                            onChange={e => {
                                setSlugManual(true)
                                setSlugValue(generateSlug(e.target.value))
                            }}
                        />
                        <p className="text-[10px] text-luxury-subtext/50 tracking-luxury">Used in /product/[slug] — auto-generated from name</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Price */}
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
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
                                className="bg-[#121214] border-white/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-white h-12"
                            />
                        </div>

                        {/* Stock (Base) */}
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
                                Initial Stock *
                            </Label>
                            <Input
                                name="stock"
                                type="number"
                                min="0"
                                placeholder="50"
                                defaultValue={product?.id ? 0 : 50}
                                required
                                className="bg-[#121214] border-white/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-white h-12"
                            />
                        </div>
                    </div>

                    {/* Shipping Dimensions + Customs */}
                    <div className="p-4 bg-[#0B0B0D]/5 rounded-lg border border-white/5 space-y-4">
                        <Label className="text-[10px] uppercase tracking-widest text-gold font-bold">Shipping &amp; Customs Details</Label>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase text-luxury-subtext">Weight (oz)</Label>
                                <Input name="weight_oz" type="number" step="0.01" defaultValue={product?.weight_oz ?? ''} className="h-9 text-xs bg-black/50 border-white/10" placeholder="oz" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase text-luxury-subtext">L (in)</Label>
                                <Input name="length_in" type="number" step="0.1" defaultValue={product?.length_in ?? ''} className="h-9 text-xs bg-black/50 border-white/10" placeholder="length" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase text-luxury-subtext">W (in)</Label>
                                <Input name="width_in" type="number" step="0.1" defaultValue={product?.width_in ?? ''} className="h-9 text-xs bg-black/50 border-white/10" placeholder="width" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase text-luxury-subtext">H (in)</Label>
                                <Input name="height_in" type="number" step="0.1" defaultValue={product?.height_in ?? ''} className="h-9 text-xs bg-black/50 border-white/10" placeholder="height" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase text-luxury-subtext">Product SKU</Label>
                                <Input
                                    name="sku"
                                    value={skuValue}
                                    onChange={e => setSkuValue(e.target.value)}
                                    placeholder="e.g. DC-FND-001"
                                    className="h-9 text-[10px] font-mono uppercase bg-black/50 border-white/10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase text-luxury-subtext">Country of Origin *</Label>
                                <select
                                    name="country_of_origin"
                                    defaultValue={product?.country_of_origin ?? 'US'}
                                    className="w-full h-9 bg-black/50 border border-white/10 rounded px-2 text-[10px] uppercase font-bold outline-none focus:border-gold/50"
                                >
                                    <option value="">— Select —</option>
                                    <option value="US">🇺🇸 United States</option>
                                    <option value="FR">🇫🇷 France</option>
                                    <option value="IT">🇮🇹 Italy</option>
                                    <option value="GB">🇬🇧 United Kingdom</option>
                                    <option value="CN">🇨🇳 China</option>
                                    <option value="KR">🇰🇷 South Korea</option>
                                    <option value="JP">🇯🇵 Japan</option>
                                    <option value="DE">🇩🇪 Germany</option>
                                    <option value="CA">🇨🇦 Canada</option>
                                    <option value="AU">🇦🇺 Australia</option>
                                    <option value="IN">🇮🇳 India</option>
                                    <option value="BR">🇧🇷 Brazil</option>
                                    <option value="MX">🇲🇽 Mexico</option>
                                    <option value="ES">🇪🇸 Spain</option>
                                    <option value="NL">🇳🇱 Netherlands</option>
                                    <option value="PL">🇵🇱 Poland</option>
                                    <option value="TR">🇹🇷 Turkey</option>
                                    <option value="BD">🇧🇩 Bangladesh</option>
                                    <option value="TH">🇹🇭 Thailand</option>
                                    <option value="VN">🇻🇳 Vietnam</option>
                                    <option value="PH">🇵🇭 Philippines</option>
                                    <option value="MA">🇲🇦 Morocco</option>
                                    <option value="NG">🇳🇬 Nigeria</option>
                                    <option value="ZA">🇿🇦 South Africa</option>
                                    <option value="SG">🇸🇬 Singapore</option>
                                    <option value="AE">🇦🇪 UAE</option>
                                    <option value="PK">🇵🇰 Pakistan</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase text-luxury-subtext">Customs Value / Unit (USD)</Label>
                                <Input
                                    name="customs_value_usd"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={product?.customs_value_usd ?? ''}
                                    placeholder="e.g. 12.00"
                                    className="h-9 text-xs bg-black/50 border-white/10"
                                />
                            </div>
                        </div>
                        <p className="text-[9px] text-luxury-subtext/50 tracking-luxury">Weight in oz · Dimensions in inches · Country of origin + customs value are printed on international shipping labels (CN22/CP72).</p>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
                            Category *
                        </Label>
                        <div className="relative">
                            <select
                                name="category_id"
                                defaultValue={product?.category_id ?? ''}
                                className="w-full h-12 bg-[#121214] rounded-md border border-white/10 px-4 pr-10 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors appearance-none"
                            >
                                <option value="">— Select Category —</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxury-subtext pointer-events-none" />
                        </div>
                        {categories.length === 0 && (
                            <p className="text-[10px] text-luxury-subtext/60 tracking-luxury">
                                No active categories — create them in /admin/categories
                            </p>
                        )}
                    </div>

                    {/* Sale Price */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
                                Sale Price (USD)
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="on_sale"
                                    name="on_sale"
                                    defaultChecked={product?.on_sale}
                                />
                                <Label htmlFor="on_sale" className="text-[9px] uppercase tracking-widest text-gold cursor-pointer font-bold">
                                    Activate Discount
                                </Label>
                            </div>
                        </div>
                        <Input
                            name="sale_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 9.99"
                            defaultValue={product?.sale_price ?? ''}
                            className="bg-[#121214] border-white/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-white placeholder:text-luxury-subtext/50 h-12"
                        />
                        <p className="text-[10px] text-luxury-subtext/50 tracking-luxury">Setting a price and toggling 'On Sale' will highlight this item as a special offer.</p>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="is_featured"
                                name="is_featured"
                                defaultChecked={product?.is_featured}
                            />
                            <Label htmlFor="is_featured" className="text-[10px] uppercase tracking-luxury text-luxury-subtext cursor-pointer font-medium">
                                ⭐ Featured in Collection
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="is_bestseller"
                                name="is_bestseller"
                                defaultChecked={product?.is_bestseller}
                            />
                            <Label htmlFor="is_bestseller" className="text-[10px] uppercase tracking-luxury text-luxury-subtext cursor-pointer font-medium">
                                🏆 Mark as Bestseller
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="is_new"
                                name="is_new"
                                defaultChecked={product?.is_new}
                            />
                            <Label htmlFor="is_new" className="text-[10px] uppercase tracking-luxury text-luxury-subtext cursor-pointer font-medium">
                                ✨ Mark as New Arrival
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3 pt-2">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label className="text-[9px] uppercase tracking-luxury text-luxury-subtext/40">Visibility Status</Label>
                                <select
                                    name="status"
                                    defaultValue={product?.status || 'active'}
                                    className="bg-[#121214] border border-white/10 rounded px-3 py-2 text-[10px] uppercase tracking-luxury font-bold outline-none h-10 w-full"
                                >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* Description */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
                                Description *
                            </Label>
                            <span className={`text-[9px] font-mono tabular-nums ${
                                descCount < 20 ? 'text-red-400' :
                                descCount < 50 ? 'text-amber-400' : 'text-emerald-500'
                            }`}>
                                {descCount} chars{descCount < 20 ? ' — brief' : descCount < 50 ? ' — good' : ' — excellent'}
                            </span>
                        </div>
                        <Textarea
                            name="description"
                            defaultValue={product?.description}
                            placeholder="Product details..."
                            onChange={e => setDescCount(e.target.value.length)}
                            className="bg-[#121214] border-white/10 rounded-md focus-visible:ring-gold/50 focus-visible:ring-offset-0 text-white placeholder:text-luxury-subtext/50 min-h-[120px] resize-y"
                        />
                        <p className="text-[9px] text-luxury-subtext/40 tracking-luxury">Describe your masterpiece. High quality descriptions improve SEO.</p>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-luxury text-luxury-subtext">
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
            <div className="border border-white/10 rounded-luxury overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowVariants(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-[#121214] hover:bg-gold/10 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-luxury text-white font-medium">
                            Product Variants
                        </span>
                        {visibleVariants.length > 0 && (
                            <span className="bg-gold text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                {visibleVariants.length}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-luxury-subtext transition-transform ${showVariants ? 'rotate-180' : ''}`}
                    />
                </button>

                {showVariants && (
                    <div className="p-6 space-y-4 bg-[#0B0B0D]">
                        <p className="text-[10px] text-luxury-subtext/70 uppercase tracking-luxury">
                            Add shade, size, type, or bundle variants. Variant price overrides the base price when selected.
                        </p>

                        {/* Variant Table */}
                        <div className="overflow-x-auto border border-white/5 rounded-md">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#121214] text-[9px] uppercase tracking-luxury text-luxury-subtext font-bold border-b border-white/10">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[120px]">Variant Name</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3">Price ($)</th>
                                        <th className="px-4 py-3">Stock</th>
                                        <th className="px-4 py-3">Weight (oz)</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Color/Image</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal/5 text-xs text-white">
                                    {variants.map((v, index) => {
                                        if (v._deleted) return null
                                        return (
                                            <tr key={index} className="hover:bg-[#0B0B0D]/5 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={v.title}
                                                        onChange={e => updateVariant(index, 'title', e.target.value)}
                                                        placeholder="e.g. Ruby Red"
                                                        className="h-8 text-xs bg-black/50 border-transparent focus:border-gold/50"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={v.variant_type}
                                                        onChange={e => updateVariant(index, 'variant_type', e.target.value)}
                                                        className="h-8 text-[10px] uppercase bg-black/50 border border-white/5 rounded px-1 outline-none"
                                                    >
                                                        {VARIANT_TYPE_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={v.sku || ''}
                                                        onChange={e => updateVariant(index, 'sku', e.target.value)}
                                                        placeholder="Auto"
                                                        className="h-8 text-[10px] font-mono bg-black/50 border-transparent focus:border-gold/50 uppercase"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={v.price}
                                                        onChange={e => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                                        className="h-8 w-20 text-xs bg-black/50 border-transparent focus:border-gold/50"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        value={v.stock}
                                                        onChange={e => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                                        className="h-8 w-16 text-xs bg-black/50 border-transparent focus:border-gold/50"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={v.weight || 0}
                                                        onChange={e => updateVariant(index, 'weight', parseFloat(e.target.value) || 0)}
                                                        className="h-8 w-16 text-xs bg-black/50 border-transparent focus:border-gold/50"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={v.status || 'active'}
                                                        onChange={e => updateVariant(index, 'status', e.target.value)}
                                                        className={`h-8 text-[10px] uppercase font-bold border border-white/5 rounded px-1 
                                                            ${v.status === 'draft' ? 'text-luxury-subtext bg-[#121214]' : 'text-emerald-600 bg-emerald-950/20'}`}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="draft">Draft</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative group/swatch">
                                                            <input
                                                                type="color"
                                                                value={v.color_code || '#000000'}
                                                                onChange={e => updateVariant(index, 'color_code', e.target.value)}
                                                                className="w-6 h-6 rounded-full border border-white/10 cursor-pointer overflow-hidden p-0 bg-transparent shadow-sm"
                                                            />
                                                            <div className="hidden group-hover/swatch:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-white text-[8px] rounded uppercase">Swatch</div>
                                                        </div>

                                                        <SingleImageUpload
                                                            value={v.image_url || ''}
                                                            onChange={url => updateVariant(index, 'image_url', url)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index)}
                                                        className="text-luxury-subtext hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            onClick={addVariant}
                            className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-white font-bold border border-white/10 rounded-md px-6 py-4 w-full bg-[#121214] hover:bg-gold/5 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-gold" />
                            Add Variant Row
                        </button>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-8 border-t border-white/10">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-white text-[#0B0B0D] rounded-full px-12 py-6 text-[11px] font-medium uppercase tracking-luxury hover:bg-gold transition-all shadow-soft hover:shadow-luxury disabled:opacity-50 min-w-[200px]"
                >
                    {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4 inline" /> : null}
                    {product?.id ? 'Refine Masterpiece' : 'Forge Collection Item'}
                </Button>
            </div>
        </form>
    )
}

