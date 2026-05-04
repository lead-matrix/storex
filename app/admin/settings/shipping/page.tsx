import ShippingRateManager from "@/components/admin/ShippingRateManager";
import { createClient } from "@/lib/supabase/server";

export default async function ShippingSettingsPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'shipping_settings')
        .maybeSingle();

    return <ShippingRateManager initialConfig={data?.setting_value || {}} />;
}

