import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any })

export async function POST(req: Request) {
    // Auth guard
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { orderId, reason } = await req.json()
        if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

        // Get the order and its stripe payment intent / session id
        const adminSupabase = await createAdminClient()
        const { data: order } = await adminSupabase
            .from('orders')
            .select('id, status, stripe_session_id, stripe_payment_intent_id, amount_total')
            .eq('id', orderId)
            .single()

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        if (order.status === 'refunded') return NextResponse.json({ error: 'Order already refunded' }, { status: 400 })
        if (order.status === 'pending' || order.status === 'cancelled') {
            return NextResponse.json({ error: 'Cannot refund an order that was never paid' }, { status: 400 })
        }

        // Resolve payment intent
        let paymentIntentId = order.stripe_payment_intent_id

        if (!paymentIntentId && order.stripe_session_id) {
            // Look up via Stripe checkout session
            const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
            paymentIntentId = session.payment_intent as string
        }

        if (!paymentIntentId) {
            return NextResponse.json({ error: 'No Stripe payment intent found for this order' }, { status: 400 })
        }

        // Issue full refund
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: (reason || 'requested_by_customer') as Stripe.RefundCreateParams.Reason,
        })

        // Update order status
        await adminSupabase
            .from('orders')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('id', orderId)

        return NextResponse.json({ success: true, refundId: refund.id, amount: refund.amount })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Stripe Refund]', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
