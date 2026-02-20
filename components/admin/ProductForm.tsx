'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/lib/actions/admin'
import VariantsManager from './VariantsManager'
import { ImageUpload } from './ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ProductFormProps {
    product?: any
}

export function ProductForm({ product }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState<string[]>(product?.images || [])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            // Add images to formData as comma separated string
            formData.set('images', images.join(', '))

            if (product?.id) {
                formData.set('id', product.id)
                await updateProduct(formData)
            } else {
                await createProduct(formData)
            }
            router.push('/admin/products')
            router.refresh()
        } catch (error) {
            console.error('Submission error:', error)
            alert('An architectural error occurred while saving.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark/60">Product Name</Label>
                        <Input
                            name="name"
                            defaultValue={product?.name}
                            placeholder="e.g. Obsidian Foundation"
                            required
                            className="bg-background-primary border-gold-primary/20 rounded-none focus-visible:ring-gold-primary focus-visible:ring-offset-0 text-text-bodyDark placeholder:text-text-mutedDark/20 h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark/60">Base Price (USD)</Label>
                        <Input
                            name="base_price"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            defaultValue={product?.base_price}
                            required
                            className="bg-background-primary border-gold-primary/20 rounded-none focus-visible:ring-gold-primary focus-visible:ring-offset-0 text-text-bodyDark placeholder:text-text-mutedDark/20 h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark/60">Category</Label>
                        <Input
                            name="category"
                            defaultValue={product?.category}
                            placeholder="e.g. FACE, LIPS, EYES"
                            required
                            className="bg-background-primary border-gold-primary/20 rounded-none focus-visible:ring-gold-primary focus-visible:ring-offset-0 text-text-bodyDark placeholder:text-text-mutedDark/20 h-12"
                        />
                    </div>

                    <div className="flex items-center space-x-3 py-4">
                        <Switch id="is_featured" name="is_featured" defaultChecked={product?.is_featured} />
                        <Label htmlFor="is_featured" className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark/60 cursor-pointer">Feature in Collection</Label>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark/60">Essence (Description)</Label>
                        <Textarea
                            name="description"
                            defaultValue={product?.description}
                            placeholder="Describe the masterpiece..."
                            required
                            className="bg-background-primary border-gold-primary/20 rounded-none focus-visible:ring-gold-primary focus-visible:ring-offset-0 text-text-bodyDark placeholder:text-text-mutedDark/20 min-h-[180px] resize-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark/60">Visual Gallery</Label>
                        <ImageUpload
                            images={images}
                            onImagesChange={setImages}
                            maxImages={10}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-12 border-t border-gold-primary/10">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-1 h-1 bg-gold-primary rounded-full" />
                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-gold-primary font-bold">Variant Orchestrator</h3>
                </div>
                <VariantsManager initialVariants={product?.variants || []} />
            </div>

            <div className="flex justify-end pt-12">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gold-primary text-background-primary rounded-none px-12 py-6 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-gold-hover transition-all disabled:opacity-50 min-w-[200px]"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {product ? 'Refine Masterpiece' : 'Forge Collection Item'}
                </Button>
            </div>
        </form>
    )
}
