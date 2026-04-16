import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// GET /api/admin/today-revenue?start=<ISO>&end=<ISO>
// `start` and `end` are UTC ISO strings computed by the browser for
// midnight..23:59:59 in the admin's LOCAL timezone.
// e.g. Texas CDT (UTC-5) Apr 15 → start=2026-04-15T05:00:00.000Z  end=2026-04-16T04:59:59.999Z
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end   = searchParams.get('end')

    // Validate — must be valid ISO timestamps
    if (!start || !end || isNaN(Date.parse(start)) || isNaN(Date.parse(end))) {
        return NextResponse.json({ error: 'Invalid start/end params' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('orders')
        .select('amount_total')
        .in('status', ['paid', 'shipped', 'delivered'])
        .neq('customer_email', 'pending@stripe')
        .gte('created_at', start)
        .lte('created_at', end)

    if (error) {
        console.error('[today-revenue] Supabase error:', error)
        return NextResponse.json({ revenue: 0 })
    }

    const revenue = data?.reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0) || 0
    return NextResponse.json({ revenue })
}
