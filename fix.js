const fs = require('fs');

let s = fs.readFileSync('MASTER.sql', 'utf8');

// The file might use \r\n, so let's normalize to \n first for easier matching
s = s.replace(/\r\n/g, '\n');

// 1. CREATE TABLE public.products
s = s.replace('CREATE TABLE IF NOT EXISTS public.products (\n    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    name text NOT NULL,', 'CREATE TABLE IF NOT EXISTS public.products (\n    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    title text NOT NULL,');

s = s.replace("        is_active boolean NOT NULL DEFAULT true,\n        metadata jsonb NOT NULL DEFAULT '{}',", "        status text NOT NULL DEFAULT 'active',\n        metadata jsonb NOT NULL DEFAULT '{}',");

// 2. The INSERT statements for products
let parts = s.split('INSERT INTO public.products (');
for (let i = 1; i < parts.length; i++) {
    let part = parts[i];
    // Inside part, change 'name' column and 'is_active' column
    part = part.replace(/\bname,/, 'title,');
    part = part.replace(/\bis_active,/, 'status,');

    let subParts = part.split('ON CONFLICT (slug) DO');
    if (subParts.length > 1) {
        // Values block is subParts[0]. We need to replace boolean with 'active'/'draft'
        subParts[0] = subParts[0].replace(/,\n        (true|false),\n        (true|false),\n        ARRAY/g, (m, feat, act) => {
            return ",\n        " + feat + ",\n        " + (act === 'true' ? "'active'" : "'draft'") + ",\n        ARRAY";
        });

        part = subParts.join('ON CONFLICT (slug) DO');
    }

    // ON CONFLICT SET replacements
    part = part.replace('SET name = EXCLUDED.name,', 'SET title = EXCLUDED.title,');
    part = part.replace('is_active = EXCLUDED.is_active,', 'status = EXCLUDED.status,');

    parts[i] = part;
}
s = parts.join('INSERT INTO public.products (');

// Restore \r\n just in case (optional, but postgres handles both fine. Let's not risk breaking powershell line endings if they matter, wait, actually let's leave it as \n. Git converts it appropriately based on core.autocrlf)

fs.writeFileSync('MASTER.sql', s);
console.log('SQL patches applied correctly.');
