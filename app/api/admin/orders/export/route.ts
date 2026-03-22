import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Ensure admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Fetch all orders with items
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                status,
                amount_total,
                customer_email,
                shipping_address,
                tracking_number,
                order_items (
                    product_id,
                    quantity,
                    price_at_purchase
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert to CSV – RFC 4180: wrap every field in double-quotes and
        // escape internal double-quotes by doubling them.
        const csvEscape = (val: unknown): string => {
            const s = String(val ?? '');
            return `"${s.replace(/"/g, '""')}"`;
        };

        const headers = ["Order ID", "Date", "Customer", "Amount", "Status", "Tracking", "City", "State", "Items Count"];
        const rows = orders.map(o => [
            o.id,
            new Date(o.created_at).toLocaleDateString(),
            o.customer_email || 'Guest',
            o.amount_total,
            o.status,
            o.tracking_number || '',
            (o.shipping_address as any)?.city || '',
            (o.shipping_address as any)?.state || '',
            o.order_items?.length || 0
        ]);

        const csvContent = [
            headers.map(csvEscape).join(","),
            ...rows.map(r => r.map(csvEscape).join(","))
        ].join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=orders_export_${new Date().toISOString().split('T')[0]}.csv`
            }
        });

    } catch (err: any) {
        return new NextResponse(err.message || "Internal Error", { status: 500 });
    }
}
