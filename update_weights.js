const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    // 1. Get current products to see what exists
    const { data: products } = await supabase.from('products').select('*').limit(1);
    console.log("Product columns:", Object.keys(products[0]));

    // 2. Fetch all products and give them weight = 1 (lb), length = 10, width = 7, height = 5
    // since user wants default unit in lb and in
    const { data: allProducts } = await supabase.from('products').select('id');
    for (const p of allProducts) {
        await supabase.from('products').update({
            weight_grams: 453.592, // 1 lb in grams
        }).eq('id', p.id);
    }

    // For variants
    const { data: variants } = await supabase.from('product_variants').select('id');
    if (variants && variants.length > 0) {
        for (const v of variants) {
            await supabase.from('product_variants').update({
                weight: 1, // 1 lb
            }).eq('id', v.id);
        }
    }
    console.log("Updated all items to 1 lb default.");
}
run().catch(console.error);
