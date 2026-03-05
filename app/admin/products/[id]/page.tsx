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
    const { data } = await supabase.from('products').select('title').eq('id', id).single()
    return { title: data ? `Edit: ${data.title} | Admin` : 'Edit Product | Admin' }
}

export default async function EditProductPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: product, error } = await supabase
        .from('products')
        .select(`
            id, title, slug, description, images, is_featured, is_bestseller, status, category_id,
            product_variants(
                id, title, sku, price, compare_price, 
                inventory(stock_quantity)
            )
        `)
        .eq('id', id)
        .single()

    if (error || !product) notFound()

    // Normalise variants for the form
    const variants = (product.product_variants ?? []).map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        compare_price: v.compare_price,
        stock: v.inventory?.stock_quantity ?? 0
    }))

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
                <p className="text-textsoft text-sm tracking-luxury uppercase font-medium">Evolving: {product.title}</p>
            </div>

            <div className="bg-white rounded-luxury border border-charcoal/10 p-8 shadow-soft">
                <ProductForm
                    product={{
                        id: product.id,
                        title: product.title,
                        slug: product.slug,
                        description: product.description,
                        images: product.images ?? [],
                        is_featured: product.is_featured,
                        is_bestseller: product.is_bestseller,
                        status: product.status,
                        category_id: product.category_id,
                    }}
                    variants={variants}
                />
            </div>
        </div>
    )
}
