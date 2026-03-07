import { createClient } from "@/lib/supabase/server";

export type AuditAction =
    | 'product_create'
    | 'product_update'
    | 'product_delete'
    | 'order_update'
    | 'shipping_label_generated'
    | 'system_setting_update'
    | 'user_ban';

export async function logAdminAction(
    action: AuditAction,
    targetTable: string,
    targetId: string,
    details?: any
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("Attempted to log admin action without user context");
            return;
        }

        await supabase.from('admin_audit_logs').insert({
            admin_id: user.id,
            action,
            target_table: targetTable,
            target_id: targetId,
            details: details,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Do not throw here, as audit logging failure shouldn't necessarily block the main action unless critically required
    }
}

