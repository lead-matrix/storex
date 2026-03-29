import 'server-only';
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates an admin Supabase client with service role key
 * WARNING: Only use this in server-side code and server actions
 * This bypasses RLS policies - use with extreme caution
 */
export const supabaseAdmin = createSupabaseClient(
    supabaseUrl!,
    supabaseServiceKey!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Backward compatibility function
export const createClient = async () => supabaseAdmin;
