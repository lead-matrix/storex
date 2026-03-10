const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
    // We can't easily run arbitrary DDL SQL via the JS client without a custom RPC.
    // Instead we will just use the REST API via fetch if possible, or print the SQL.
    console.log("Please run this SQL in your Supabase SQL Editor:");
    console.log("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address jsonb;");

    // We can attempt to fix it if the user has a run_sql RPC, but they might not.
    console.log("Checking if we have an RPC to run SQL...");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.rpc('run_sql', { sql: 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address jsonb;' });

    if (error) {
        console.error("Could not auto-apply. Error:", error.message);
    } else {
        console.log("Successfully applied ALTER TABLE.");
    }
}

main();
