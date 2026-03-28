export function getParcelForWeight(totalWeightLb: number) {
    if (totalWeightLb < 0.5) {
        // Small package(9.5*6in) 
        return {
            name: "Small Package",
            length: "9.5",
            width: "6",
            height: "1",
            distanceUnit: "in" as any,
            weight: Math.max(0.1, totalWeightLb).toFixed(2),
            massUnit: "lb" as any
        };
    } else if (totalWeightLb <= 2) {
        // Medium(11*9in)
        return {
            name: "Medium Package",
            length: "11",
            width: "9",
            height: "2",
            distanceUnit: "in" as any,
            weight: totalWeightLb.toFixed(2),
            massUnit: "lb" as any
        };
    } else {
        // standard(boxes 10*7*5in)
        return {
            name: "Standard Box",
            length: "10",
            width: "7",
            height: "5",
            distanceUnit: "in" as any,
            weight: totalWeightLb.toFixed(2),
            massUnit: "lb" as any
        };
    }
}

/**
 * Shared weight calculator — single source of truth for both createShippingLabel()
 * and getShippingRates() so the two paths can never drift.
 *
 * Expects items that carry either variant_weight_oz or product_weight_oz (both in oz).
 * Falls back to 2 oz per item if neither is set.
 */
export function calculateTotalWeightLb(items: Array<{
    quantity: number
    variant_weight_oz?: number | null
    product_weight_oz?: number | null
}>): number {
    const totalOz = items.reduce((acc, item) => {
        const weightOz =
            (item.variant_weight_oz && item.variant_weight_oz > 0)
                ? item.variant_weight_oz
                : (item.product_weight_oz && item.product_weight_oz > 0)
                    ? item.product_weight_oz
                    : 2 // default 2oz fallback
        return acc + weightOz * item.quantity
    }, 0)
    return totalOz / 16
}

export function calculateShippingRate(
  weightLb: number,
  subtotal: number,
  config: any,
  type: 'standard' | 'express' | 'intl_standard' | 'intl_express'
): { cost: number; name: string; minDays: number; maxDays: number } {
  // Free shipping check (US only)
  const freeThreshold = parseFloat(config.free_shipping_threshold ?? '100');
  if (type === 'standard' && subtotal >= freeThreshold) {
    return {
      cost: 0,
      name: config.standard_label || 'Free Standard Shipping',
      minDays: 3,
      maxDays: 5,
    };
  }

  // Select bracket config
  let brackets: Array<{ max_lb: number; rate: number }> = [];
  let name = '';
  let minDays = 3;
  let maxDays = 5;

  switch (type) {
    case 'standard':
      brackets = config.weight_brackets || DEFAULT_US_STANDARD_BRACKETS;
      name = config.standard_label || 'USPS Ground Advantage (3-5 Days)';
      minDays = 3;
      maxDays = 5;
      break;
    case 'express':
      brackets = config.express_weight_brackets || DEFAULT_US_EXPRESS_BRACKETS;
      name = config.express_label || 'USPS Priority Mail (1-3 Days)';
      minDays = 1;
      maxDays = 3;
      break;
    case 'intl_standard':
      brackets = config.intl_weight_brackets || DEFAULT_INTL_STANDARD_BRACKETS;
      name = 'USPS Priority Mail International';
      minDays = 6;
      maxDays = 10;
      break;
    case 'intl_express':
      brackets = config.intl_express_weight_brackets || DEFAULT_INTL_EXPRESS_BRACKETS;
      name = 'USPS Priority Mail Express International';
      minDays = 3;
      maxDays = 5;
      break;
  }

  // Find matching bracket (first bracket where weight <= max_lb)
  const matchingBracket = brackets.find((b) => weightLb <= b.max_lb);
  const cost = matchingBracket ? parseFloat(String(matchingBracket.rate)) : parseFloat(String(brackets[brackets.length - 1]?.rate ?? 15.99));

  return { cost, name, minDays, maxDays };
}

// Default brackets (fallback if DB config missing)
const DEFAULT_US_STANDARD_BRACKETS = [
  { max_lb: 0.5, rate: 4.99 },
  { max_lb: 1, rate: 6.99 },
  { max_lb: 2, rate: 8.99 },
  { max_lb: 5, rate: 12.99 },
  { max_lb: 999, rate: 15.99 },
];

const DEFAULT_US_EXPRESS_BRACKETS = [
  { max_lb: 1, rate: 9.99 },
  { max_lb: 3, rate: 14.99 },
  { max_lb: 999, rate: 19.99 },
];

const DEFAULT_INTL_STANDARD_BRACKETS = [
  { max_lb: 1, rate: 19.99 },
  { max_lb: 3, rate: 29.99 },
  { max_lb: 5, rate: 39.99 },
  { max_lb: 999, rate: 59.99 },
];

const DEFAULT_INTL_EXPRESS_BRACKETS = [
  { max_lb: 1, rate: 49.99 },
  { max_lb: 3, rate: 69.99 },
  { max_lb: 999, rate: 89.99 },
];

export async function createShippingLabel(order: any) {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) {
        console.warn("SHIPPO_API_KEY is missing");
        return { tracking_number: "SHP-DEBUG", label_url: "#", status: "PENDING" };
    }

    try {
        const { shippo } = await import('@/lib/shippo');

        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        // Fetch order items with variant and product weights
        const { data: orderItems } = await supabase
            .from('order_items')
            .select(`
                quantity,
                product_variants:variant_id ( weight ),
                products:product_id ( weight_oz )
            `)
            .eq('order_id', order.id);

        // Map to the shared calculator's expected shape
        const weightItems = (orderItems || []).map((item: any) => ({
            quantity: item.quantity || 1,
            variant_weight_oz: item.product_variants?.weight ? Number(item.product_variants.weight) : null,
            product_weight_oz: item.products?.weight_oz ? Number(item.products.weight_oz) : null,
        }));

        const totalWeightLb = calculateTotalWeightLb(weightItems);
        const parcel = getParcelForWeight(totalWeightLb);

        const { data: settings } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'warehouse_info')
            .maybeSingle();

        const warehouse = settings?.setting_value || {
            name: "Dina Cosmetic",
            street1: "5430 FM 359 Rd S Ste 400 PMB 1013",
            city: "Brookshire",
            state: "TX",
            zip: "77423",
            country: "US",
            phone: "+12816877609",
            email: "dinaecosmetic@gmail.com"
        };

        const shipment = await shippo.shipments.create({
            addressFrom: warehouse,
            addressTo: {
                name: order.shipping_address?.name || order.billing_address?.name || "Valued client",
                street1: order.shipping_address?.address?.line1 || order.shipping_address?.line1 || order.billing_address?.line1 || order.billing_address?.address?.line1 || order.billing_address?.street1,
                street2: order.shipping_address?.address?.line2 || order.shipping_address?.line2 || order.billing_address?.line2 || order.billing_address?.address?.line2 || order.billing_address?.street2,
                city: order.shipping_address?.address?.city || order.shipping_address?.city || order.billing_address?.city || order.billing_address?.address?.city,
                state: order.shipping_address?.address?.state || order.shipping_address?.state || order.billing_address?.state || order.billing_address?.address?.state,
                zip: order.shipping_address?.address?.postal_code || order.shipping_address?.zip || order.billing_address?.postal_code || order.billing_address?.zip || order.billing_address?.address?.postal_code,
                country: order.shipping_address?.address?.country || order.shipping_address?.country || order.billing_address?.country || order.billing_address?.address?.country || "US",
            },
            parcels: [parcel]
        });

        const rate = shipment.rates[0];

        // BUG FIX: async: false ensures Shippo returns the label synchronously
        // rather than QUEUED — so labelUrl is never null.
        const transaction = await shippo.transactions.create({
            rate: rate.objectId,
            labelFileType: 'PDF',
            async: false,
        });

        if (transaction.status !== 'SUCCESS') {
            throw new Error(`Label generation failed: ${transaction.messages?.[0]?.text || 'Unknown Shippo error'}`);
        }

        return {
            tracking_number: transaction.trackingNumber,
            label_url: transaction.labelUrl,
            status: transaction.status,
        };
    } catch (error) {
        console.error("Shippo Error:", error);
        throw error;
    }
}
