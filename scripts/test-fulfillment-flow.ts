import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('--- Order Automation Simulation ---');

    // 1. Check for a product to buy
    const { data: variant, error: vError } = await supabase
        .from('product_variants')
        .select(`
            id, 
            stock, 
            price_override, 
            products:product_id (
                title,
                base_price
            )
        `)
        .gt('stock', 0)
        .limit(1)
        .single();

    if (vError || !variant) {
        console.error('No stock available for testing or query failed:', vError?.message);
        return;
    }

    const parent = (variant as any).products;
    const itemPrice = variant.price_override || parent?.base_price || 0;
    const productTitle = parent?.title || 'Unknown Product';

    console.log(`Step 1: Found Asset - ${productTitle} (${variant.id}) | Stock: ${variant.stock} | Price: $${itemPrice}`);

    // 2. Create Mock Order
    const { data: order, error: oError } = await supabase
        .from('orders')
        .insert({
            customer_email: 'test-commander@example.com',
            amount_total: Number(itemPrice),
            payment_status: 'paid',
            fulfillment_status: 'unfulfilled',
            status: 'paid',
            currency: 'usd',
            shipping_address: {
                line1: '123 Test St',
                city: 'Austin',
                state: 'TX',
                postal_code: '78701',
                country: 'US',
                name: 'Test Commander'
            }
        })
        .select()
        .single();

    if (oError) {
        console.error('Failed to create mock order:', oError.message);
        return;
    }

    console.log(`Step 2: Order Created - #${order.id.slice(0, 8)}`);

    // 3. Create Order Item (Trigger Inventory Logic)
    const { error: iError } = await supabase
        .from('order_items')
        .insert({
            order_id: order.id,
            variant_id: variant.id,
            quantity: 1,
            price: itemPrice
        });

    if (iError) {
        console.error('Failed to create order item:', iError.message);
        return;
    }

    // Manually decrement stock (Simulating the atomic process usually done in RPC or Stripe webhook)
    const { error: sError } = await supabase
        .from('product_variants')
        .update({ stock: variant.stock - 1 })
        .eq('id', variant.id);

    if (sError) console.error('Stock decrement failed:', sError.message);

    console.log(`Step 3: Items Registered & Stock Decremented.`);

    // 4. Verify Inventory Logs (Rule 49 & 50)
    const { data: logs, error: lError } = await supabase
        .from('inventory_logs')
        .select('*')
        .eq('variant_id', variant.id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (lError || !logs?.length) {
        console.warn('Warning: Inventory Log not found. Trigger might not be active.');
    } else {
        console.log(`Step 4: Inventory Log Verified - Change: ${logs[0].change_amount} | Reason: ${logs[0].reason}`);
    }

    // 5. Simulate Partial Fulfillment Designation
    console.log('Step 5: Simulating Partial Fulfillment Designation...');

    // In a real flow, this would call our Shippo service. 
    // Here we simulate the DB updates our service performs.

    // Create Shipment
    const { data: shipment, error: shError } = await supabase
        .from('shipments')
        .insert({
            order_id: order.id,
            carrier: 'USPS',
            service: 'Priority',
            status: 'label_created'
        })
        .select()
        .single();

    if (shError) {
        console.error('Shipment creation failed:', shError.message);
        return;
    }

    // Link Item to Shipment (New Partial Fulfillment Logic)
    const { data: orderItem, error: oiError } = await supabase.from('order_items').select('id').eq('order_id', order.id).single();

    if (oiError || !orderItem) {
        console.error('Order item retrieval failed:', oiError?.message);
        return;
    }

    const { error: siError } = await supabase.from('shipment_items').insert({
        shipment_id: shipment.id,
        order_item_id: orderItem.id,
        quantity: 1
    });

    if (siError) {
        console.error('Shipment item link failed:', siError.message);
        return;
    }

    // Update Order Item status
    await supabase
        .from('order_items')
        .update({ fulfilled_quantity: 1 })
        .eq('id', orderItem.id);

    // Update Order Status to Partial or Fulfilled
    await supabase
        .from('orders')
        .update({ fulfillment_status: 'fulfilled', status: 'shipped' })
        .eq('id', order.id);

    console.log(`Step 6: Fulfillment Ritual Complete. Order #${order.id.slice(0, 8)} is now SHIPPED.`);
    console.log('--- Simulation Successful ---');
}

runTest();
