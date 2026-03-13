import { stripe } from '@/lib/stripe';
import { createOrder } from '@/lib/db/orders';
import { createOrderItems } from '@/lib/db/orderItems';
import { sendOrderConfirmationEmail } from '@/lib/utils/email';
import { createShipmentAndLabel } from '@/services/shippingService';

export async function processPaymentSuccess(session: any) {
    try {
        const customer_email = session.customer_details?.email || session.metadata?.customer_email;
        const customer_name = session.customer_details?.name;
        const shipping_details = session.shipping_details;
        const amount_total = (session.amount_total || 0) / 100;

        // 1. Create order
        const order = await createOrder({
            customer_email,
            customer_name: customer_name || null,
            customer_phone: shipping_details?.phone || null,
            shipping_address: shipping_details?.address || {},
            amount_total,
            currency: session.currency || 'usd',
            payment_status: 'paid',
            fulfillment_status: 'unfulfilled',
        });

        // 2. Insert order items
        let parsedItems = [];
        if (session.metadata?.items) {
            parsedItems = JSON.parse(session.metadata.items);
        }

        if (parsedItems.length > 0) {
            const orderItemsToInsert = parsedItems.map((item: any) => ({
                order_id: order.id,
                product_id: item.id,
                variant_id: item.variant_id,
                quantity: item.quantity || 1,
                price: item.price || 0,
                weight: item.weight || 0,
                length: item.length || 0,
                width: item.width || 0,
                height: item.height || 0,
            }));
            await createOrderItems(orderItemsToInsert);
        }

        // 3. Trigger shipment creation (Shippo)
        await createShipmentAndLabel(order.id);

        // 4. Decrement Stock
        const { supabaseAdmin } = await import('@/lib/supabase');
        for (const item of parsedItems) {
            if (item.variant_id) {
                // Decrement variant stock
                const { data: v } = await supabaseAdmin.from('product_variants').select('stock').eq('id', item.variant_id).single();
                if (v) await supabaseAdmin.from('product_variants').update({ stock: Math.max(0, (v.stock || 0) - (item.quantity || 1)) }).eq('id', item.variant_id);
            } else if (item.id) {
                // Decrement base product stock
                const { data: p } = await supabaseAdmin.from('products').select('stock').eq('id', item.id).single();
                if (p) await supabaseAdmin.from('products').update({ stock: Math.max(0, (p.stock || 0) - (item.quantity || 1)) }).eq('id', item.id);
            }
        }

        // 5. Send confirmation email
        await sendOrderConfirmationEmail({
            customerEmail: customer_email,
            orderId: order.id,
            customerName: customer_name || 'Valued Client',
            totalAmount: amount_total,
            items: parsedItems
        });

        // 6. Mark abandoned cart as recovered
        await supabaseAdmin
            .from('abandoned_carts')
            .update({ status: 'recovered' })
            .eq('customer_email', customer_email);

        return order;
    } catch (error: any) {
        console.error('processPaymentSuccess error:', error);
        throw error;
    }
}
