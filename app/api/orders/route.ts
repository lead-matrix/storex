import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listOrders, getOrderById } from '@/services/orderService';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const orders = await listOrders({
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('q') ?? undefined,
      limit: Number(searchParams.get('limit') ?? 50),
      offset: Number(searchParams.get('offset') ?? 0),
    });

    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST remains for any direct order creation needs (rare — Stripe webhook handles production flow)
export async function POST(req: Request) {
  try {
    const { email, total_amount } = await req.json();
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

    const supabase = await createClient();
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ customer_email: email, amount_total: total_amount ?? 0, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
