import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { items } = await req.json()

        // ── Auth: optional — guests are fully supported ──────────────────────
        const cookieStore = await cookies()
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get: (name) => cookieStore.get(name)?.value } }
        )
        const { data: { user } } = await supabaseAuth.auth.getUser()

        // ── Service-role client for DB writes (bypasses RLS safely) ──────────
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
        const metadataItems: { product_id: string; variant_id: string | null; quantity: number; price: number }[] = []
        let subtotal = 0

        // ── 1. Validate every item against the database ───────────────────────
        for (const item of items) {
            const productId = item.productId
            const variantId = item.id !== productId ? item.id : null

            const { data: product } = await supabase
                .from('products')
                .select('name, base_price, sale_price, on_sale, stock, images, is_active')
                .eq('id', productId)
                .single()

            if (!product || !product.is_active)
                throw new Error(`"${item.name}" is no longer available.`)

            let dbPrice = product.on_sale && product.sale_price
                ? Number(product.sale_price)
                : Number(product.base_price)
            let dbStock = product.stock

            if (variantId) {
                const { data: variant } = await supabase
                    .from('variants')
                    .select('name, price_override, stock, is_active')
                    .eq('id', variantId)
                    .single()

                if (!variant || !variant.is_active)
                    throw new Error(`Variant is no longer available.`)
                if (variant.price_override !== null) dbPrice = Number(variant.price_override)
                dbStock = variant.stock
            }

            // ── 2. Inventory gate ──────────────────────────────────────────────
            if (dbStock < item.quantity)
                throw new Error(`Insufficient stock for "${item.name}". Only ${dbStock} left.`)

            const unitAmount = Math.round(dbPrice * 100)
            subtotal += dbPrice * item.quantity

            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.variantName
                            ? `${product.name} — ${item.variantName}`
                            : product.name,
                        images: product.images?.[0] ? [product.images[0]] : [],
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            })

            metadataItems.push({ product_id: productId, variant_id: variantId, quantity: item.quantity, price: dbPrice })
        }

        // ── 3. Server-side shipping & tax ─────────────────────────────────────
        const shippingRate = subtotal >= 75 ? 0 : 9.99
        const taxTotal = subtotal * 0.08

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

        // ── 4. Create PENDING order (works for guests and signed-in users) ────
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: user?.id ?? null,
                customer_email: user?.email ?? null,  // guest email grabbed from Stripe later
                email: user?.email ?? 'pending@guest.local', // Fallback for legacy database NOT NULL constraints
                amount_total: subtotal + shippingRate + taxTotal,
                status: 'pending',
                fulfillment_status: 'unfulfilled',
            }])
            .select()
            .single()

        if (orderError) throw orderError

        // ── 5. Stripe hosted checkout session (email captured on payment form) ─
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',

            // Pre-fill for signed-in users; blank for guests (Stripe asks them)
            customer_email: user?.email ?? undefined,

            // Collect billing + shipping address from ALL customers
            billing_address_collection: 'required',
            shipping_address_collection: {
                // Worldwide shipping as per store policy
                allowed_countries: [
                    'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE',
                    'NO', 'DK', 'FI', 'BE', 'CH', 'AT', 'PT', 'IE', 'NZ', 'SG',
                    'JP', 'AE', 'SA', 'KW', 'QA', 'BH', 'OM',
                ],
            },

            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,

            // Pass order_id so the webhook can find and update the pending order
            metadata: {
                order_id: order.id,
                items: JSON.stringify(metadataItems),
            },

            // Phone number for shipping communication
            phone_number_collection: { enabled: true },

            // Allow promotion codes / discounts
            allow_promotion_codes: true,

            custom_text: {
                submit: { message: 'We ship worldwide from Texas, USA. Orders processed within 1–2 business days.' },
            },
        })

        // ── 6. Link Stripe session to the pending order ────────────────────────
        await supabase
            .from('orders')
            .update({ stripe_session_id: session.id })
            .eq('id', order.id)

        return NextResponse.json({ url: session.url })

    } catch (error: any) {
        const msg = error?.message || 'Checkout failed'
        console.error('Checkout Error Detailed:', error)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
