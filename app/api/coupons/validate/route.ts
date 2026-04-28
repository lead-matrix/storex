import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const { code, amount } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        const supabase = await createAdminClient();
        const { data, error } = await supabase.rpc('validate_coupon', {
            p_code: code,
            p_purchase_amount: amount || 0
        });

        if (error) {
            console.error('[Coupon Validation] RPC Error:', error);
            return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[Coupon Validation] Error:', err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}
