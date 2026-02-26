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

    // Fetch Profile if needed (for full name)
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const userName = profile?.full_name || user.email?.split("@")[0] || "Guest";
    const userRole = profile?.role || "customer";

    return (
        <div className="min-h-screen bg-pearl text-charcoal pt-32 pb-24 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <AccountDashboard
                    user={{ email: user.email, created_at: user.created_at }}
                    profile={{ full_name: profile?.full_name, role: profile?.role }}
                />

                {/* Sign Out Action */}
                <div className="md:col-span-2 flex justify-center pt-8 border-t border-charcoal/5">
                    <SignOutButton />
                </div>
            </div>
        </div>
    );
}
