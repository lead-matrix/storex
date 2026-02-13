import { createClient } from '@supabase/supabase-js';

// Note: strictly server-side only. Never expose this key to the client.
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        // Fallback for build phase
        return {} as any;
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

export const supabaseAdmin = getSupabaseAdmin();
