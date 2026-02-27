import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { items } = await req.json()
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const line_items = []
        const metadataItems = []

        for (const item of items) {
            // Validate pricing and existence
            const productId = item.productId || item.id
            const { data: product } = await supabase
                .from('products')
                .select('name, base_price, images')
                .eq('id', productId)
                .single()

            if (!product) continue

            const itemPrice = Number(item.price)

            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.variantName ? `${product.name} — ${item.variantName}` : product.name,
                        images: product.images?.[0] ? [product.images[0]] : [],
                    },
                    unit_amount: Math.round(itemPrice * 100),
                },
                quantity: item.quantity,
            })

            // Track for atomic processing in webhook
            metadataItems.push({
                product_id: productId,
                quantity: item.quantity,
                price: itemPrice,
                variant_id: item.id !== productId ? item.id : null,
            })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB'],
            },
            metadata: {
                // Stripe metadata values must be strings
                items: JSON.stringify(metadataItems),
            },
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('Checkout Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
