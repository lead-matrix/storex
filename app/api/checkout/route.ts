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

        const { data: { user } } = await supabase.auth.getUser()

        const line_items = []
        const metadataItems = []
        let subtotal = 0

        for (const item of items) {
            const productId = item.productId
            const variantId = item.id !== productId ? item.id : null

            // 1. Fetch source of truth from DB
            const { data: product } = await supabase
                .from('products')
                .select('name, base_price, sale_price, on_sale, stock, images, is_active')
                .eq('id', productId)
                .single()

            if (!product || !product.is_active) throw new Error(`Product ${item.name} is no longer available.`)

            let dbPrice = product.on_sale && product.sale_price ? Number(product.sale_price) : Number(product.base_price)
            let dbStock = product.stock

            // 2. Adjust for variant if applicable
            if (variantId) {
                const { data: variant } = await supabase
                    .from('variants')
                    .select('name, price_override, stock, is_active')
                    .eq('id', variantId)
                    .single()

                if (!variant || !variant.is_active) throw new Error(`Variant ${item.variantName} is no longer available.`)
                if (variant.price_override !== null) dbPrice = Number(variant.price_override)
                dbStock = variant.stock
            }

            // 3. Inventory Check
            if (dbStock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${dbStock}`)
            }

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

            metadataItems.push({
                product_id: productId,
                variant_id: variantId,
                quantity: item.quantity,
                price: dbPrice,
            })
        }

        // 4. Server-Side Calculations (Match your store rules)
        const shippingRate = subtotal >= 75 ? 0 : 9.99
        const taxRate = 0.08
        const taxTotal = subtotal * taxRate

        if (shippingRate > 0) {
            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Shipping', description: subtotal >= 75 ? 'Complimentary' : 'Standard Delivery' },
                    unit_amount: Math.round(shippingRate * 100),
                },
                quantity: 1,
            })
        }

        // 5. Create PENDING order in DB (Traceability)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: user?.id || null,
                customer_email: user?.email || null,
                amount_total: subtotal + shippingRate + taxTotal,
                status: 'pending',
                fulfillment_status: 'unfulfilled',
                metadata: { items: metadataItems }
            }])
            .select()
            .single()

        if (orderError) throw orderError

        // 6. Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            customer_email: user?.email || undefined,
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB'],
            },
            metadata: {
                order_id: order.id,
                items: JSON.stringify(metadataItems),
            },
        })

        // Update order with stripe session id
        await supabase
            .from('orders')
            .update({ stripe_session_id: session.id })
            .eq('id', order.id)

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('Checkout Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
