"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/");
    };

    return (
        <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-8 py-3 border border-white/10 hover:border-white/30 hover:bg-white/5 text-luxury-subtext hover:text-white uppercase transition-all duration-300 font-medium text-[10px] tracking-widest rounded-lg"
        >
            <LogOut size={16} strokeWidth={1.5} />
            Sign Out
        </button>
    );
}

