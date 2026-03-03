import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { customer_name, email, phone, address, total_amount, items } = payload;

        const supabase = await createClient();

        // Basic insertion, since production orders generally verify against Stripe webhooks.
        // This endpoint supports the prompt's minimum flow requirement.
        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                email: email, // Fallback for legacy database NOT NULL constraints
                customer_email: email,
                amount_total: total_amount, // New schema standard
                total_amount: total_amount, // Legacy schema fallback
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: order.id,
            customer_name,
            email,
            phone,
            address,
            total_amount: order.total_amount,
            status: order.status,
            created_at: order.created_at
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
