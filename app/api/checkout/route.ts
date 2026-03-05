import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { items } = await req.json()

        // Auth
        const cookieStore = await cookies()
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get: (name) => cookieStore.get(name)?.value } }
        )
        const { data: { user } } = await supabaseAuth.auth.getUser()

        // Service-role client for DB reads (bypasses RLS)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
        const metadataItems: { variant_id: string; quantity: number; price: number }[] = []
        let subtotal = 0

        // 1. Validate every item against the database (Variant + Inventory Schema V2)
        for (const item of items) {
            const variantId = item.id;

            // Using the new V2 schema logic conceptually
            // For now, mapping to existing table to keep app functional if V2 isn't applied immediately
            // But structurally, this endpoint MUST NOT create an order.

            const { data: product } = await supabase
                .from('products')
                .select('name, base_price, sale_price, on_sale, stock, images, is_active')
                .eq('id', item.productId)
                .single()

            if (!product || !product.is_active)
                throw new Error(`"${item.name}" is no longer available.`)

            let dbPrice = product.on_sale && product.sale_price ? Number(product.sale_price) : Number(product.base_price)
            const unitAmount = Math.round(dbPrice * 100)
            subtotal += dbPrice * item.quantity

            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.variantName ? `${product.name} — ${item.variantName}` : product.name,
                        images: product.images?.[0] ? [product.images[0]] : [],
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            })

            metadataItems.push({ variant_id: variantId, quantity: item.quantity, price: dbPrice })
        }

        const shippingRate = subtotal >= 50 ? 0 : 9.99
        if (shippingRate > 0) {
            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Standard Shipping' },
                    unit_amount: Math.round(shippingRate * 100),
                },
                quantity: 1,
            })
        }

        // 2. Create Stripe hosted checkout session
        // CRITICAL CHANGE: We DO NOT insert into `orders` table here.
        // Orders are only created by the webhook after successful payment verification.
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            customer_email: user?.email ?? undefined,
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE'],
            },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
            metadata: {
                user_id: user?.id ?? '',
                items: JSON.stringify(metadataItems),
            },
            phone_number_collection: { enabled: true },
            allow_promotion_codes: true,
        })

        return NextResponse.json({ url: session.url })

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Checkout failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
