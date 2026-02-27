import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const { data: product, error } = await supabase
            .from('products')
            .select('id, name, description, base_price, images, inventory, is_active, created_at')
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.base_price,
            image_url: product.images?.[0] || '',
            stock: product.inventory,
            is_active: product.is_active,
            created_at: product.created_at
        });
    } catch (error) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
}
