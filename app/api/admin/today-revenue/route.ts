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

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('admin_today_stats');

    if (error) {
        console.error('[today-revenue] Supabase error:', error)
        return NextResponse.json({ revenue: 0 })
    }

    // RPC returns { revenue: numeric, order_count: int, ... }
    return NextResponse.json({ 
        revenue: Number(data?.revenue || 0),
        order_count: data?.order_count || 0
    })
}

