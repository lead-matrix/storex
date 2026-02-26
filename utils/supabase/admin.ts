import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates an admin Supabase client with service role key
 * WARNING: Only use this in server-side code and server actions
 * This bypasses RLS policies - use with extreme caution
 */
export const createClient = async () => {
    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl!,
        supabaseServiceKey!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        },
    );
};

/**
 * Legacy export for backward compatibility
 */
export const supabaseAdmin = createAdminClient;
