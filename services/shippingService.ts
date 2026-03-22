import { shippo } from '@/lib/shippo';
import { getOrderById, updateOrderStatus } from '@/lib/db/orders';
import { getItemsByOrder } from '@/lib/db/orderItems';
import { createShipment, getShipmentByOrder } from '@/lib/db/shipments';
import { createShippingLabel } from '@/lib/db/labels';
import { sendShippingNotificationEmail } from '@/lib/utils/email';
import { createTrackingEvent } from '@/lib/db/tracking';
import { updateFulfilledQuantity } from '@/lib/db/orderItems';
import { createShipmentItems } from '@/lib/db/shipmentItems';
import { calculateTotalWeightLb, getParcelForWeight } from '@/lib/utils/shippo';

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

        // Use shared weight calculator — single source of truth shared with createShippingLabel()
        const weightItems = allItems.map((item: any) => ({
            quantity: item.quantity,
            variant_weight_oz: item.product_variants?.weight ? Number(item.product_variants.weight) : null,
            product_weight_oz: item.products?.weight_grams ? Number(item.products.weight_grams) : null,
        }));

        let totalWeight: number;
        if (itemsToFulfill && itemsToFulfill.length > 0) {
            const filteredItems = itemsToFulfill.map(f => {
                const match = allItems.find((i: any) => i.id === f.id);
                return {
                    quantity: f.quantity,
                    variant_weight_oz: match?.product_variants?.weight ? Number(match.product_variants.weight) : null,
                    product_weight_oz: match?.products?.weight_grams ? Number(match.products.weight_grams) : null,
                };
            });
            totalWeight = calculateTotalWeightLb(filteredItems);
        } else {
            totalWeight = calculateTotalWeightLb(weightItems);
        }

        const parcelData = getParcelForWeight(totalWeight);

        // 1. Resolve Warehouse Info (Origin)
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: settings } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'warehouse_info')
            .maybeSingle();

        const warehouse = settings?.setting_value || {
            name: process.env.WAREHOUSE_NAME || 'Dina Cosmetic',
            street1: process.env.WAREHOUSE_ADDRESS_LINE1 || '5430 FM 359 Rd S Ste 400 PMB 1013',
            city: process.env.WAREHOUSE_CITY || 'Brookshire',
            state: process.env.WAREHOUSE_STATE || 'TX',
            zip: process.env.WAREHOUSE_ZIP || '77423',
            country: process.env.WAREHOUSE_COUNTRY || 'US',
            phone: process.env.WAREHOUSE_PHONE || '+12816877609',
        };

        const addressFrom: any = {
            name: warehouse.name,
            street1: warehouse.street1,
            city: warehouse.city,
            state: warehouse.state,
            zip: warehouse.zip,
            country: warehouse.country,
            phone: warehouse.phone,
        };

        // 2. International Customs Handling
        let customsDeclarationId: string | undefined;
        const isInternational = addressTo.country !== addressFrom.country;

        if (isInternational) {
            console.log(`[shippingService] International shipment detected (${addressFrom.country} -> ${addressTo.country}). Generating customs declaration.`);
            
            const customsItems = await Promise.all(allItems.map(async (item: any) => {
                const itemQuantity = (itemsToFulfill ? itemsToFulfill.find(f => f.id === item.id)?.quantity : item.quantity) || 0;
                if (itemQuantity <= 0) return null;

                const weightOz = item.product_variants?.weight || item.products?.weight_grams || 2;
                const valueUsd = item.products?.customs_value_usd || item.price || 10;
                const originCountry = item.products?.country_of_origin || addressFrom.country;
                const sku = item.product_variants?.sku || item.products?.sku || `DC-${item.product_id.substring(0, 5)}`;

                return await shippo.customsItems.create({
                    description: item.products?.title || 'Cosmetic Item',
                    quantity: itemQuantity,
                    netWeight: weightOz.toString(),
                    massUnit: 'oz',
                    valueAmount: valueUsd.toString(),
                    valueCurrency: 'USD',
                    originCountry: originCountry,
                });
            }));

            const declaration = await shippo.customsDeclarations.create({
                contentsType: 'MERCHANDISE',
                contentsExplanation: 'Cosmetic items for personal use.',
                nonDeliveryOption: 'RETURN',
                certify: true,
                certifySigner: warehouse.name || 'Warehouse Manager',
                items: customsItems.filter(Boolean).map(ci => (ci as any).objectId) as any[],
                eelPfc: 'NOEEI_30_37_a', // Under $2500 exemption
            } as any);
            
            customsDeclarationId = declaration.objectId;
        }

        const shippoShipment = await shippo.shipments.create({
            addressFrom,
            addressTo,
            parcels: [parcelData],
            customsDeclaration: customsDeclarationId,
            async: false,
        });

        return {
            shipmentId: shippoShipment.objectId || '',
            rates: (shippoShipment.rates || []) as any[],
            parcelName: (parcelData as any).name || 'Standard Parcel'
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
        const isFullyFulfilled = allItems.every((i: any) => (i.fulfilled_quantity || 0) >= i.quantity);

        // Stamp tracking_number on the order so the Shippo webhook can look it up
        await updateOrderStatus(orderId, {
            fulfillment_status: isFullyFulfilled ? 'fulfilled' : 'partial',
            ...(transaction.trackingNumber ? { tracking_number: transaction.trackingNumber } : {}),
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
