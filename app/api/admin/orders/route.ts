import { NextResponse } from 'next/server';
import { listOrders } from '@/lib/db/orders';

// Optionally add middleware or server-side auth here, ensuring this is admin only
// However, standard Next.js middleware in `middleware.ts` is preferred which should 
// already protect `/api/admin/*` per the requirements.

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const orders = await listOrders(limit, offset);
        return NextResponse.json({ orders });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
