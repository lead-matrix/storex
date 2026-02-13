import { createClient } from "@supabase/supabase-js";

/**
 * 2️⃣ Client-Side Supabase Client
 * Uses the public NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Use ONLY in "use client" components for browser-safe data fetching.
 */
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
