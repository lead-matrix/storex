"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Save, Globe, Truck, Layout, Users } from "lucide-react";

interface SettingsFormProps {
    action: (formData: FormData) => Promise<any>;
    children: React.ReactNode;
    title: string;
    iconName: "globe" | "truck" | "layout" | "users";
}

const ICON_MAP = {
    globe: Globe,
    truck: Truck,
    layout: Layout,
    users: Users,
};

export function SettingsForm({ action, children, title, iconName }: SettingsFormProps) {
    const Icon = ICON_MAP[iconName] || Globe;
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                const result = await action(formData);
                if (result?.success) {
                    toast.success(`${title} sync complete`);
                }
            } catch (err: any) {
                toast.error(err.message || "Operation failed");
            }
        });
    }

    return (
        <form action={handleSubmit}>
            <section className="bg-[#121214] rounded-luxury shadow-luxury border border-white/5 p-10 space-y-12">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex mt-1 items-center gap-4">
                        <Icon className="w-4 h-4 text-gold" />
                        <h2 className="text-[10px] uppercase tracking-luxury text-luxury-subtext font-medium">{title}</h2>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-white/5 text-white border border-white/5 px-6 py-2.5 rounded-full shadow-sm hover:bg-gold text-[10px] uppercase tracking-luxury font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        {isPending ? "Syncing..." : "Save Changes"}
                    </button>
                </div>

                <div className="space-y-8">
                    {children}
                </div>
            </section>
        </form>
    );
}
