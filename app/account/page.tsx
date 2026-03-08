import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountDashboard } from "@/features/account/components/AccountDashboard";
import SignOutButton from "@/components/auth/SignOutButton";

export const metadata = {
    title: "My Account | DINA COSMETIC",
    description: "Manage your account and view order history.",
};

export default async function AccountPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch Profile if needed
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch Orders
    const { data: orders } = await supabase
        .from("orders")
        .select(`
            id,
            created_at,
            amount_total,
            status,
            order_items (
                quantity,
                products (title)
            )
        `)
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6">
            <div className="max-w-6xl mx-auto space-y-16">
                <AccountDashboard
                    user={{ email: user.email, created_at: user.created_at }}
                    profile={{ full_name: profile?.full_name, role: profile?.role }}
                    orders={orders || []}
                />

                {/* Sign Out Action */}
                <div className="flex justify-center pt-12 border-t border-white/5">
                    <SignOutButton />
                </div>
            </div>
        </div>
    );
}
