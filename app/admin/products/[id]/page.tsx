import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('name').eq('id', id).single()
    return { title: data ? `Edit: ${data.name} | Admin` : 'Edit Product | Admin' }
}

export default async function EditProductPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: product, error } = await supabase
        .from('products')
        .select('id, name, slug, description, base_price, sale_price, on_sale, is_new, stock, inventory, images, is_featured, is_bestseller, is_active, category_id, variants(*)')
        .eq('id', id)
        .single()

    if (error || !product) notFound()

    // Normalise variants
    const variants = (product.variants ?? []) as Array<{
        id: string
        name: string
        variant_type: 'shade' | 'size' | 'bundle' | 'type'
        price_override: number | null
        stock: number
        is_active: boolean
    }>

    return (
        <div className="max-w-4xl space-y-8 animate-luxury-fade">
            <Link
                href="/admin/products"
                className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-textsoft hover:text-gold transition-colors font-medium"
            >
                <ArrowLeft size={12} />
                Back to Vault
            </Link>

            <div>
                <h1 className="text-3xl font-heading text-charcoal mb-1 tracking-luxury">Refine Masterpiece</h1>
                <p className="text-textsoft text-sm tracking-luxury uppercase font-medium">Evolving: {product.name}</p>
            </div>

            <div className="bg-white rounded-luxury border border-charcoal/10 p-8 shadow-soft">
                <ProductForm
                    product={{
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        description: product.description,
                        base_price: product.base_price,
                        sale_price: product.sale_price,
                        on_sale: product.on_sale,
                        is_new: product.is_new,
                        stock: product.stock ?? product.inventory ?? 0,
                        images: product.images ?? [],
                        is_featured: product.is_featured,
                        is_bestseller: product.is_bestseller,
                        is_active: product.is_active,
                        category_id: product.category_id,
                    }}
                    variants={variants}
                />
            </div>
        </div>
    )
}
