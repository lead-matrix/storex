import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const { data: product, error } = await supabase
            .from('products')
            .select(`
                id, title, description, base_price, sale_price, on_sale, images, stock, status, created_at,
                product_variants (
                    id, name, variant_type, sku, price_override, stock, color_code, image_url, status
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Group variants by type
        const variants = (product.product_variants || [])
            .filter((v: any) => v.status === 'active')
            .reduce((acc: any, v: any) => {
                const type = v.variant_type || 'option';
                if (!acc[type]) acc[type] = [];
                const basePrice = v.price_override || product.base_price;
                const salePrice = product.on_sale ? (product.sale_price || basePrice) : basePrice;

                acc[type].push({
                    id: v.id,
                    name: v.name,
                    sku: v.sku,
                    price: basePrice,
                    sale_price: product.on_sale ? product.sale_price : null,
                    final_price: salePrice,
                    stock: v.stock,
                    color_code: v.color_code,
                    image_url: v.image_url || product.images?.[0] || '',
                });
                return acc;
            }, {});

        return NextResponse.json({
            id: product.id,
            name: product.title,
            description: product.description,
            price: product.base_price,
            image_url: product.images?.[0] || '',
            stock: product.stock,
            is_active: product.status === 'active',
            created_at: product.created_at,
            variants: variants // Grouped variants: { shade: [], size: [] }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
}
