import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, slug, description, base_price, sale_price, on_sale, images, stock, is_active, created_at')
            .eq('is_active', true)
            .gt('stock', 0)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = products.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: p.on_sale && p.sale_price ? Number(p.sale_price) : Number(p.base_price),
            base_price: Number(p.base_price),
            sale_price: p.sale_price ? Number(p.sale_price) : null,
            on_sale: p.on_sale,
            image_url: p.images?.[0] || '',
            images: p.images ?? [],
            stock: p.stock,
            is_active: p.is_active,
            created_at: p.created_at,
        }));

        return NextResponse.json(formatted);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
