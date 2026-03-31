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

        let address = order.shipping_address as any;

        // Stripe-native flow: address is usually populated by webhook.
        // Fallback: If shipping is missing/incomplete, attempt to use billing_address.
        if (!address || (!address.line1 && !address.street1)) {
            console.log(`[shippingService] Order ${orderId} has incomplete shipping_address. Checking billing fallback.`);
            const billing = order.billing_address as any;
            if (billing && (billing.line1 || billing.street1)) {
                address = billing;
            }
        }

        if (!address || (!address.line1 && !address.street1)) {
            throw new Error('Order has no usable shipping or billing address. Wait for Stripe webhook to populate it.');
        }

        const addressTo: any = {
            name: order.customer_name || address.name || 'Valued Client',
            street1: address.line1 || address.street1 || '',
            street2: address.line2 || address.street2 || '',
            city: address.city || '',
            state: address.state || '',
            zip: address.postal_code || address.zip || address.postal_code || '',
            country: address.country || 'US',
            email: order.customer_email || '',
            phone: order.customer_phone || '',
        };

        if (!addressTo.street1) {
            throw new Error('Incomplete address profile: street1 is missing.');
        }

        const allItems = await getItemsByOrder(orderId);

        // BUG #2 FIX: weight_grams was renamed to weight_oz by MASTER.sql migration.
        // The old code read item.products?.weight_grams which returns null after the
        // migration, causing every item to fall back to 2oz and all rates to be wrong.
        // Changed to weight_oz in all three mapping locations below.
        const weightItems = allItems.map((item: any) => ({
            quantity: item.quantity,
            variant_weight_oz: item.product_variants?.weight ? Number(item.product_variants.weight) : null,
            product_weight_oz: item.products?.weight_oz ? Number(item.products.weight_oz) : null,
        }));

        let totalWeight: number;
        if (itemsToFulfill && itemsToFulfill.length > 0) {
            const filteredItems = itemsToFulfill.map(f => {
                const match = allItems.find((i: any) => i.id === f.id);
                return {
                    quantity: f.quantity,
                    variant_weight_oz: match?.product_variants?.weight ? Number(match.product_variants.weight) : null,
                    product_weight_oz: match?.products?.weight_oz ? Number(match.products.weight_oz) : null,
                };
            });
            totalWeight = calculateTotalWeightLb(filteredItems);
        } else {
            totalWeight = calculateTotalWeightLb(weightItems);
        }

        const parcelData = getParcelForWeight(totalWeight);

        // Resolve Warehouse Info
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

        // International Customs Handling
        let customsDeclarationId: string | undefined;
        const isInternational = addressTo.country !== addressFrom.country;

        if (isInternational) {
            console.log(`[shippingService] International shipment (${addressFrom.country} -> ${addressTo.country}). Generating customs declaration.`);

            const customsItems = await Promise.all(allItems.map(async (item: any) => {
                const itemQuantity = (itemsToFulfill ? itemsToFulfill.find(f => f.id === item.id)?.quantity : item.quantity) || 0;
                if (itemQuantity <= 0) return null;

                // BUG #2 FIX: was item.products?.weight_grams — corrected to weight_oz
                const weightOz = item.product_variants?.weight || item.products?.weight_oz || 2;
                const valueUsd = item.products?.customs_value_usd || item.price || 10;
                const originCountry = item.products?.country_of_origin || addressFrom.country;

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
                eelPfc: 'NOEEI_30_37_a',
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

        // Sort rates: preferred carriers first
        const isExpress = (order as any).metadata?.shipping_option === 'express';
        const isUS = addressTo.country === 'US';

        const sortedRates = ((shippoShipment.rates || []) as any[]).sort((a: any, b: any) => {
            const score = (r: any) => {
                if (isUS) {
                    if (r.provider === 'USPS') {
                        if (isExpress && r.servicelevel?.name?.includes('Express')) return 0;
                        if (!isExpress && r.servicelevel?.name?.includes('Priority')) return 1;
                        return 2;
                    }
                    if (r.provider === 'UPS') return 3;
                    return 4;
                } else {
                    // International
                    if (isExpress) {
                        if (r.provider === 'DHL') return 0;
                        if (r.servicelevel?.name?.includes('Express International')) return 1;
                        return 2;
                    } else {
                        if (r.provider === 'USPS' && r.servicelevel?.name?.includes('International')) return 0;
                        return 1;
                    }
                }
            };
            return score(a) - score(b);
        });

        return {
            shipmentId: shippoShipment.objectId || '',
            rates: sortedRates,
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

        // Guard: Stripe webhook must have populated address before admin can generate label
        // Guard: Stripe webhook must have populated address before admin can generate label
        let address = order.shipping_address as any;
        if (!address || (!address.line1 && !address.street1)) {
            const billing = order.billing_address as any;
            if (billing && (billing.line1 || billing.street1)) {
                address = billing;
            }
        }

        if (!address || (!address.line1 && !address.street1)) {
            throw new Error('Order has no shipping/billing address. Wait for Stripe webhook to populate it.');
        }

        // Purchase label from Shippo
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

        // Link Items to Shipment and update quantities
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
    const cheapest = rates.sort((a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount))[0];
    return purchaseLabelForRate(orderId, cheapest.objectId || '', cheapest.provider || '', cheapest.servicelevel?.name || '');
}
