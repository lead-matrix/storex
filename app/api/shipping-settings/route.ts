import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public route — returns shipping settings for the checkout page
export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "shipping_settings")
            .maybeSingle();

        if (error) throw error;

        const settings = {
            standard_rate: data?.setting_value?.standard_rate ?? "7.99",
            express_rate: data?.setting_value?.express_rate ?? "29.99",
            standard_label: data?.setting_value?.standard_label ?? "Standard Shipping (5-10 Business Days)",
            express_label: data?.setting_value?.express_label ?? "Express Shipping (2-4 Business Days)",
            free_shipping_threshold: data?.setting_value?.free_shipping_threshold ?? "100",
        };

        return NextResponse.json({ settings });
    } catch (err: any) {
        return NextResponse.json({
            settings: {
                standard_rate: "7.99",
                express_rate: "29.99",
                standard_label: "Standard Shipping (5-10 Business Days)",
                express_label: "Express Shipping (2-4 Business Days)",
                free_shipping_threshold: "100",
            }
        });
    }
}
