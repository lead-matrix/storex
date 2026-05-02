// Telegram Order Alert — Backend Function
// Checks Supabase for new paid orders and returns formatted message for Telegram

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function telegramOrderAlert() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_email, customer_name, amount_total, status, created_at, order_items(product_name, variant_name, quantity)')
      .eq('status', 'paid')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[telegramOrderAlert] Query failed:', error)
      return { success: false, error: error.message }
    }

    if (!orders || orders.length === 0) {
      return { success: true, ordersFound: 0, message: 'No new orders' }
    }

    // Format message for first order (or concatenate if multiple)
    const order = orders[0]
    const items = (order.order_items as any[] || [])
      .map(item => `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''} x${item.quantity}`)
      .join('\n')

    const message = `🎉 *New Order #${order.id.slice(0, 8).toUpperCase()}*\n\n👤 ${order.customer_name || 'Guest'}\n📧 ${order.customer_email}\n\n💰 *$${(Number(order.amount_total) / 100).toFixed(2)}*\n\n📦 Items:\n${items}\n\n⏱️ ${new Date(order.created_at).toLocaleString()}`

    return { 
      success: true, 
      ordersFound: orders.length, 
      message: message 
    }
  } catch (err) {
    console.error('[telegramOrderAlert] Error:', err)
    return { success: false, error: String(err) }
  }
}
