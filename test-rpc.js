const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    // Attempt to manually invoke the RPC using the payload from the DB
    const { data: events } = await supabase.from('stripe_events').select('*').eq('type', 'checkout.session.completed').limit(1).order('created_at', { ascending: false });

    if (!events || events.length === 0) {
        console.log("No checkout events found.");
        return;
    }

    const event = events[0];
    const session = event.data;

    let cartItems = [];
    try {
        cartItems = session.metadata?.items ? JSON.parse(session.metadata.items) : [];
    } catch (e) {
        console.error("Failed to parse cart items:", e);
    }

    console.log("Attempting RPC with payload...");
    const payload = {
        p_stripe_session_id: session.id,
        p_customer_email: session.customer_details?.email || session.customer_email || 'guest@stripe.com',
        p_amount_total: session.amount_total,
        p_currency: session.currency,
        p_metadata: {
            ...session.metadata,
            items: cartItems
        },
        p_shipping_address: session.shipping_details || null,
        p_billing_address: session.customer_details || null
    };

    console.log(JSON.stringify(payload, null, 2));

    const { error: rpcError, data: orderId } = await supabase.rpc("process_order_atomic", payload);

    if (rpcError) {
        console.error("RPC Error:", rpcError);
    } else {
        console.log("RPC Success! Order ID:", orderId);
    }
}

main();
