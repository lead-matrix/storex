'use server'

import { createClient } from "@/lib/supabase/server";
import { sendAbandonedCartRecovery } from "@/lib/resend";
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

export async function triggerRecoveryEmail(cartId: string) {
    const supabase = await ensureAdmin();

    const { data: cart, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('id', cartId)
        .single();

    if (error || !cart) throw new Error("Cart not discovered");

    const recoveryLink = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?recovery_token=${cart.recovery_token}`;

    await sendAbandonedCartRecovery(
        cart.customer_email,
        cart.items,
        cart.amount_total,
        recoveryLink
    );

    await supabase
        .from('abandoned_carts')
        .update({ status: 'emailed' })
        .eq('id', cartId);

    revalidatePath('/admin/marketing/abandoned');
}

export async function deleteAbandonedCart(id: string) {
    const supabase = await ensureAdmin();
    await supabase.from('abandoned_carts').delete().eq('id', id);
    revalidatePath('/admin/marketing/abandoned');
}
