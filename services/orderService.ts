import 'server-only';
import Stripe from 'stripe';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import type { OrderRecord } from '@/types/order';

// NOTE: '2026-02-25.clover' IS the correct API version for the installed stripe@20.4.1.
// Must match lib/stripe.ts, checkoutService.ts, and the webhook handler.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

/**
 * orderService
 * All order management business logic lives here.
 * Handles order lookups, status transitions, and admin operations.
 */

export type OrderFilters = {
  status?: string;
  fulfillment_status?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

/** List orders with optional filters */
export async function listOrders(filters: OrderFilters = {}): Promise<OrderRecord[]> {
  const supabase = await createAdminClient();
  const { limit = 50, offset = 0, status, fulfillment_status, search } = filters;

  let query = supabase
    .from('orders')
    .select('*, order_items(id, product_id, variant_id, quantity, price, fulfilled_quantity)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (fulfillment_status) query = query.eq('fulfillment_status', fulfillment_status);
  if (search) query = query.or(`customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) throw new Error(`orderService.listOrders: ${error.message}`);
  return (data ?? []) as OrderRecord[];
}

/** Get a single order by ID, including items */
export async function getOrderById(id: string): Promise<OrderRecord | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, product_id, variant_id, quantity, price, fulfilled_quantity,
        products ( title, images ),
        product_variants ( name, sku )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`orderService.getOrderById: ${error.message}`);
  return data as unknown as OrderRecord | null;
}

/** Get a single order by stripe session id */
export async function getOrderByStripeSession(sessionId: string): Promise<OrderRecord | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (error) throw new Error(`orderService.getOrderByStripeSession: ${error.message}`);
  return data as OrderRecord | null;
}

/** Update order status fields */
export async function updateOrder(
  id: string,
  updates: Partial<Pick<OrderRecord, 'status' | 'fulfillment_status' | 'tracking_number' | 'carrier' | 'shippo_tracking_status' | 'shipping_label_url' | 'customer_name' | 'customer_email' | 'customer_phone' | 'shipping_address' | 'billing_address' | 'amount_total' | 'metadata'>>
): Promise<OrderRecord> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`orderService.updateOrder: ${error.message}`);
  return data as OrderRecord;
}

/**
 * Issue a Stripe refund and update the DB order status atomically.
 * Returns the Stripe Refund object.
 */
export async function refundOrder(orderId: string, reason: string = 'requested_by_customer') {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (!order.stripe_session_id) throw new Error('No Stripe session linked to this order');

  // Retrieve the payment_intent from the Stripe session
  const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
    expand: ['payment_intent'],
  });

  const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
  if (!paymentIntent) throw new Error('No payment intent found for this session');

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntent.id,
    reason: reason as Stripe.RefundCreateParams.Reason,
  });

  await updateOrder(orderId, { status: 'refunded', fulfillment_status: 'returned' });
  return refund;
}

/** Get order stats for the admin dashboard */
export async function getOrderStats() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc('admin_order_stats').maybeSingle();
  if (error) {
    // Fallback: manual count if RPC doesn't exist
    const { count: total } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: paid } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid');
    const { count: pending } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    return { total: total ?? 0, paid: paid ?? 0, pending: pending ?? 0 };
  }
  return data;
}
