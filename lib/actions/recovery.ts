'use server'

import { createClient } from "@/lib/supabase/server";
import { sendAbandonedCartEmail } from "@/lib/utils/email";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

export async function triggerRecoveryEmail(cartId: string) {
    await requireAdmin();
    const supabase = await createAdminClient();

    const { data: cart, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('id', cartId)
        .single();

    if (error || !cart) throw new Error("Cart not discovered");

    const recoveryLink = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?recovery_token=${cart.recovery_token}`;

    await sendAbandonedCartEmail({
        customerEmail: cart.customer_email,
        customerName: 'Guest',
        totalAmount: cart.amount_total,
        recoveryLink,
        items: cart.items,
        orderId: '' // Not applicable
    });

    await supabase
        .from('abandoned_carts')
        .update({ status: 'emailed' })
        .eq('id', cartId);

    revalidatePath('/admin/marketing/abandoned');
}

export async function deleteAbandonedCart(id: string) {
    await requireAdmin();
    const supabase = await createAdminClient();
    await supabase.from('abandoned_carts').delete().eq('id', id);
    revalidatePath('/admin/marketing/abandoned');
}
