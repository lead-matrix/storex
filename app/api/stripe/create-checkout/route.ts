import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const { items, customer_email, cart_id } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        const lineItems = items.map((item: any) => {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dinacosmetic.store';
            const imageUrl = item.image
                ? (item.image.startsWith('http') ? item.image : `${baseUrl}${item.image.startsWith('/') ? '' : '/'}${item.image}`)
                : undefined;

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        images: imageUrl ? [imageUrl] : [],
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
            customer_email: customer_email,
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB', 'AU', 'FR', 'DE'],
            },
            phone_number_collection: {
                enabled: true,
            },
            metadata: {
                customer_email,
                cart_id: cart_id || '',
                items: JSON.stringify(items.map((i: any) => ({ id: i.id, variant_id: i.variant_id, quantity: i.quantity, price: i.price, name: i.name }))),
            },
        });

        // Track potential abandonment if email exists
        if (customer_email) {
            const { supabaseAdmin } = await import('@/lib/supabase');
            await supabaseAdmin.from('abandoned_carts').upsert({
                customer_email,
                items: items,
                amount_total: items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0),
                status: 'pending',
                last_active: new Date().toISOString()
            }, { onConflict: 'customer_email' }); // Keep it updated
        }

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
