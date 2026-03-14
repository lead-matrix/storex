import { shippo } from '@/lib/shippo';
import { getOrderById, updateOrderStatus } from '@/lib/db/orders';
import { getItemsByOrder } from '@/lib/db/orderItems';
import { createShipment, getShipmentByOrder } from '@/lib/db/shipments';
import { createShippingLabel } from '@/lib/db/labels';
import { sendShippingNotificationEmail } from '@/lib/utils/email';
import { createTrackingEvent } from '@/lib/db/tracking';
import { updateFulfilledQuantity } from '@/lib/db/orderItems';
import { createShipmentItems } from '@/lib/db/shipmentItems';

export async function getShippingRates(orderId: string, itemsToFulfill?: { id: string, quantity: number }[]) {
    try {
        const order = await getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        const address = order.shipping_address as any;

        // Defensive check: If address is missing or severely incomplete, try fallback
        if (!address || (!address.line1 && !address.street1)) {
            console.warn(`[shippingService] Order ${orderId} has incomplete shipping_address. Checking billing fallback.`);
        }

        const addressTo: any = {
            name: order.customer_name || address?.name || address?.recipient || 'Valued Client',
            // Support both flat and Stripe-nested address structures
            street1: address?.address?.line1 || address?.line1 || address?.street1 || order.billing_address?.address?.line1 || order.billing_address?.line1 || '',
            street2: address?.address?.line2 || address?.line2 || address?.street2 || order.billing_address?.address?.line2 || order.billing_address?.line2 || '',
            city: address?.address?.city || address?.city || order.billing_address?.address?.city || order.billing_address?.city || '',
            state: address?.address?.state || address?.state || order.billing_address?.address?.state || order.billing_address?.state || '',
            zip: address?.address?.postal_code || address?.address?.zip || address?.postal_code || address?.zip || order.billing_address?.address?.postal_code || order.billing_address?.postal_code || '',
            country: address?.address?.country || address?.country || order.billing_address?.address?.country || order.billing_address?.country || 'US',
            email: order.customer_email || address?.email || '',
        };

        if (!addressTo.street1) {
            throw new Error('Incomplete shipping address: Street address (line1) is missing from both shipping and billing data.');
        }

        const allItems = await getItemsByOrder(orderId);
        let totalWeight = 0;

        const calculateWeight = (item: any) => {
            // Priority 1: Variant specific weight (in lbs)
            if (item.product_variants?.weight && Number(item.product_variants.weight) > 0) {
                return Number(item.product_variants.weight);
            }
            // Priority 2: Product base weight_grams (convert to lbs)
            if (item.products?.weight_grams && Number(item.products.weight_grams) > 0) {
                return Number(item.products.weight_grams) / 453.592;
            }
            // Fallback
            return 1;
        };

        if (itemsToFulfill && itemsToFulfill.length > 0) {
            itemsToFulfill.forEach(f => {
                const match = allItems.find(i => i.id === f.id);
                if (match) totalWeight += calculateWeight(match) * f.quantity;
            });
        } else {
            totalWeight = allItems.reduce((acc: number, item: any) => acc + calculateWeight(item) * item.quantity, 0);
        }

        const parcelData: any = {
            length: '10', width: '8', height: '4',
            distanceUnit: 'in', weight: totalWeight.toString() || '1', massUnit: 'lb',
        };

        const addressFrom: any = {
            name: process.env.WAREHOUSE_NAME || 'Warehouse',
            street1: process.env.WAREHOUSE_ADDRESS_LINE1 || '123 Main St',
            city: process.env.WAREHOUSE_CITY || 'San Francisco',
            state: process.env.WAREHOUSE_STATE || 'CA',
            zip: process.env.WAREHOUSE_ZIP || '94105',
            country: process.env.WAREHOUSE_COUNTRY || 'US',
            phone: process.env.WAREHOUSE_PHONE || '+1 555 341 9393',
        };

        const shippoShipment = await shippo.shipments.create({
            addressFrom, addressTo, parcels: [parcelData], async: false,
        });

        return {
            shipmentId: shippoShipment.objectId || '',
            rates: (shippoShipment.rates || []) as any[]
        };
    } catch (error) {
        console.error('getShippingRates error:', error);
        throw error;
    }
}

export async function purchaseLabelForRate(orderId: string, rateId: string, carrier: string, service: string, itemsToFulfill?: { id: string, quantity: number }[]) {
    try {
        const order = await getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        // Purchase label
        const transaction = await shippo.transactions.create({
            rate: rateId,
            labelFileType: 'PDF',
            async: false,
        });

        if (transaction.status !== 'SUCCESS') {
            throw new Error(`Label purchase failed: ${transaction.messages?.[0]?.text || 'Unknown error'}`);
        }

        // Save Shipment to DB
        const dbShipment = await createShipment({
            order_id: orderId,
            shippo_shipment_id: '',
            carrier: carrier || '',
            service: service || '',
            status: 'pending',
        });

        // Link Items to Shipment and Update Quantities
        if (itemsToFulfill && itemsToFulfill.length > 0) {
            await createShipmentItems(itemsToFulfill.map(i => ({
                shipment_id: dbShipment.id,
                order_item_id: i.id,
                quantity: i.quantity
            })));

            for (const item of itemsToFulfill) {
                await updateFulfilledQuantity(item.id, item.quantity);
            }
        }

        // Save Label to DB
        await createShippingLabel({
            shipment_id: dbShipment.id,
            shippo_transaction_id: transaction.objectId || '',
            tracking_number: transaction.trackingNumber || '',
            label_url: transaction.labelUrl || '',
            carrier: carrier || '',
            service: service || '',
        });

        // Tracking event
        await createTrackingEvent({
            shipment_id: dbShipment.id,
            status: 'label_created',
            status_details: 'Shipping label created',
            event_time: new Date().toISOString(),
            raw: transaction,
        });

        // Check overall fulfillment status
        const allItems = await getItemsByOrder(orderId);
        const isFullyFulfilled = allItems.every(i => (i.fulfilled_quantity || 0) >= i.quantity);

        await updateOrderStatus(orderId, {
            fulfillment_status: isFullyFulfilled ? 'fulfilled' : 'partial'
        });

        if (transaction.trackingNumber) {
            await sendShippingNotificationEmail({
                customerEmail: order.customer_email || '',
                customerName: order.customer_name || 'Valued Client',
                orderId: order.id,
                trackingNumber: transaction.trackingNumber,
                totalAmount: order.amount_total || 0
            });
        }

        return {
            labelUrl: transaction.labelUrl || '',
            trackingNumber: transaction.trackingNumber || ''
        };
    } catch (error) {
        console.error('purchaseLabelForRate error:', error);
        throw error;
    }
}

export async function createShipmentAndLabel(orderId: string) {
    // Legacy support: auto-select cheapest
    const { rates } = await getShippingRates(orderId);
    if (!rates || rates.length === 0) throw new Error('No rates');
    const cheapest = rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0];
    return purchaseLabelForRate(orderId, cheapest.objectId || '', cheapest.provider || '', cheapest.servicelevel?.name || '');
}
