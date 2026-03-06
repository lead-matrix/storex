
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zsahskxejgbrvfhobfyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYWhza3hlamdicnZmaG9iZnlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYyNTE1NywiZXhwIjoyMDg3MjAxMTU3fQ.tVDTUxGgE71seATxUqpzaxgw0pL8ApmP3hU8zCLXTUM'
);

async function test() {
  const { data, error } = await supabase.from('products').insert([{
    name: 'Test Product',
    slug: 'test-product',
    description: 'test',
    base_price: 10,
    stock: 5,
    images: [],
    is_featured: false,
    is_bestseller: false,
    is_new: false,
    on_sale: false,
    is_active: true
  }]).select().single();
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
    await supabase.from('products').delete().eq('id', data.id);
  }
}
test();
