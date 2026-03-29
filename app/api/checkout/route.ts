import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/services/checkoutService';
import { checkoutLimiter } from '@/lib/api/rateLimit';

export async function POST(req: Request) {
  // Rate limit: max 10 checkout attempts per IP per minute
  const { success } = checkoutLimiter.check(req);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const { url } = await createCheckoutSession(items);
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('[POST /api/checkout]', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}