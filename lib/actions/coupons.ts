'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error("Unauthorized");
    }
    return supabase;
}

export async function createCoupon(formData: FormData) {
    const supabase = await ensureAdmin();

    const code = (formData.get('code') as string)?.toUpperCase().trim();
    const discount_type = formData.get('discount_type') as string;
    const discount_value = parseFloat(formData.get('discount_value') as string);
    const min_purchase_amount = parseFloat(formData.get('min_purchase_amount') as string) || 0;
    const max_uses = formData.get('max_uses') ? parseInt(formData.get('max_uses') as string) : null;
    const expires_at = formData.get('expires_at') ? new Date(formData.get('expires_at') as string).toISOString() : null;

    if (!code || !discount_type || isNaN(discount_value)) {
        throw new Error("Missing required fields");
    }

    const { error } = await supabase
        .from('coupons')
        .insert([{
            code,
            discount_type,
            discount_value,
            min_purchase_amount,
            max_uses,
            expires_at,
            status: 'active'
        }]);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/marketing');
}

export async function toggleCouponStatus(id: string, currentStatus: string) {
    const supabase = await ensureAdmin();
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';

    const { error } = await supabase
        .from('coupons')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/marketing');
}

export async function deleteCoupon(id: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/marketing');
}
