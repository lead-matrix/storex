import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const { data: product, error } = await supabase
            .from('products')
            .select('id, title, description, base_price, images, stock, status, created_at')
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: product.id,
            name: product.title,
            description: product.description,
            price: product.base_price,
            image_url: product.images?.[0] || '',
            stock: product.stock,
            is_active: product.status === 'active',
            created_at: product.created_at
        });
    } catch (error) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
}
