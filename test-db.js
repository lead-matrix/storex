const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("--- LATEST STRIPE EVENTS ---");
    const { data: events, error: eventsErr } = await supabase
        .from('stripe_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (eventsErr) console.error(eventsErr);
    else console.log(JSON.stringify(events, null, 2));

    console.log("\n--- LATEST ORDERS ---");
    const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, status, customer_email, amount_total, created_at, stripe_session_id')
        .order('created_at', { ascending: false })
        .limit(3);

    if (ordersErr) console.error(ordersErr);
    else console.log(JSON.stringify(orders, null, 2));
}

main();
