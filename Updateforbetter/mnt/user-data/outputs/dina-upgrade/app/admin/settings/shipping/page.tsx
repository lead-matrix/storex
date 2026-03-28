import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import ShippingRateManager from "@/components/admin/ShippingRateManager"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Shipping Rates | Admin" }

export default async function AdminShippingPage() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "shipping_settings")
    .maybeSingle()

  return (
    <div className="animate-luxury-fade">
      <ShippingRateManager initialConfig={data?.setting_value || {}} />
    </div>
  )
}
