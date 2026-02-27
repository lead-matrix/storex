import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, description, base_price, images, inventory, is_active, created_at')
            .eq('is_active', true);

        if (error) throw error;

        // Map to expected structure if needed
        const formatted = products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.base_price,
            image_url: p.images?.[0] || '',
            stock: p.inventory,
            is_active: p.is_active,
            created_at: p.created_at
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
