import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) return NextResponse.json([]);

    // Cap query length to prevent expensive full-table scans from very long strings
    const safeQuery = query.slice(0, 50);

    try {
        const supabase = await createClient();

        // Ensure admin
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return new NextResponse("Unauthorized", { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUser.id)
            .single();

        if (profile?.role !== 'admin') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const results: any[] = [];

        // 1. Search Products
        const { data: products } = await supabase
            .from('products')
            .select('id, title, slug')
            .ilike('title', `%${safeQuery}%`)
            .limit(5);

        if (products) {
            results.push(...products.map(p => ({
                id: p.id,
                title: p.title,
                type: 'product',
                href: `/admin/products?q=${p.id}`,
                subtitle: `Slug: ${p.slug}`
            })));
        }

        // 2. Search Orders (by ID or Email)
        const { data: orders } = await supabase
            .from('orders')
            .select('id, customer_email, amount_total')
            .or(`id.ilike.%${safeQuery}%,customer_email.ilike.%${safeQuery}%`)
            .limit(5);

        if (orders) {
            results.push(...orders.map(o => ({
                id: o.id,
                title: `Order #${o.id.slice(0, 8).toUpperCase()}`,
                type: 'order',
                href: `/admin/orders?id=${o.id}`,
                subtitle: `${o.customer_email || 'Guest'} · $${o.amount_total}`
            })));
        }

        // 3. Search Users
        const { data: users } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .or(`email.ilike.%${safeQuery}%,full_name.ilike.%${safeQuery}%`)
            .limit(5);

        if (users) {
            results.push(...users.map(u => ({
                id: u.id,
                title: u.full_name || u.email,
                type: 'user',
                href: `/admin/users?q=${u.id}`,
                subtitle: u.email
            })));
        }

        return NextResponse.json(results);

    } catch (err) {
        return new NextResponse("Search Error", { status: 500 });
    }
}
