const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const fs = require('fs');

async function run() {
    const { data: prods, error: err } = await supabase.from('products').select('slug, status, title, product_variants(name, status)');
    const output = { prods, err };
    fs.writeFileSync('db_check.json', JSON.stringify(output, null, 2));

    const { data: files } = await supabase.storage.from('product-images').list();
    fs.appendFileSync('db_check.json', '\nFILES:\n' + JSON.stringify(files, null, 2));
}
run();
