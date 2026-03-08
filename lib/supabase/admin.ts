import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates an admin Supabase client with service role key
 * WARNING: Only use this in server-side code and server actions
 * This bypasses RLS policies - use with extreme caution
 */
export async function createClient() {
    return createSupabaseClient(
        supabaseUrl!,
        supabaseServiceKey!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};

/**
 * Legacy export for backward compatibility
 */
export const supabaseAdmin = createClient;
