import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "", 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function run() {
  const { data } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'shipping_settings').single();
  console.log(JSON.stringify(data, null, 2));
}

run();
