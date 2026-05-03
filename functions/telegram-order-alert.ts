import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
const telegramChatId = process.env.TELEGRAM_CHAT_ID

if (!supabaseUrl || !supabaseKey || !telegramBotToken || !telegramChatId) {
    console.error('Missing environment variables for Telegram notifications')
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export async function checkAndNotifyNewOrders() {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, customer_email, customer_name, amount_total, status, created_at, order_items(product_id, quantity, product_name, variant_name)')
            .eq('status', 'paid')
            .gte('created_at', fiveMinutesAgo)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching orders:', error)
            return
        }

        if (!orders || orders.length === 0) {
            console.log('No new orders found')
            return
        }

        for (const order of orders) {
            await sendTelegramAlert(order)
        }

        console.log(`Sent ${orders.length} Telegram notifications`)
    } catch (err) {
        console.error('Telegram notification error:', err)
    }
}

async function sendTelegramAlert(order: any) {
    const itemsList = (order.order_items || [])
        .map(
            (item: any) =>
                `• ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''} x${item.quantity}`
        )
        .join('\n')

    const message = `
🎉 **NEW ORDER RECEIVED**

👤 *Customer:* ${order.customer_name || 'Guest'}
📧 *Email:* ${order.customer_email}
💰 *Amount:* $${(Number(order.amount_total) / 100).toFixed(2)}
⏰ *Time:* ${new Date(order.created_at).toLocaleString()}

📦 *Items:*
${itemsList || 'No items'}

🔗 [View in Admin](https://dinacosmetic.store/admin/orders)
`.trim()

    const payload = {
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'Markdown',
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Telegram API error:', errorData)
        } else {
            console.log(`Sent alert for order ${order.id}`)
        }
    } catch (err) {
        console.error('Failed to send Telegram message:', err)
    }
}
