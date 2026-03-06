import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: products, error } = await supabase
            .from('products')
            .select('id, title, slug, description, base_price, sale_price, on_sale, images, stock, status, created_at')
            .eq('status', 'active')
            .gt('stock', 0)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = products.map(p => ({
            id: p.id,
            name: p.title, // Mapping to 'name' in JSON for backward compatibility if needed, but selecting 'title' from DB
            slug: p.slug,
            description: p.description,
            price: p.on_sale && p.sale_price ? Number(p.sale_price) : Number(p.base_price),
            base_price: Number(p.base_price),
            sale_price: p.sale_price ? Number(p.sale_price) : null,
            on_sale: p.on_sale,
            image_url: p.images?.[0] || '',
            images: p.images ?? [],
            stock: p.stock,
            is_active: p.status === 'active',
            created_at: p.created_at,
        }));

        return NextResponse.json(formatted);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
