import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// GET /api/admin/today-revenue?date=YYYY-MM-DD
// `date` is the calendar date in the admin's LOCAL timezone (sent by the browser).
// We query orders from midnight of that UTC-calendar-equivalent-day.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // The browser sends its local date as YYYY-MM-DD so we match "today" correctly
    // regardless of server timezone.
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date') // e.g. "2026-04-15"

    let startOfDay: string
    let endOfDay: string

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        startOfDay = `${dateParam}T00:00:00.000Z`
        endOfDay   = `${dateParam}T23:59:59.999Z`
    } else {
        // Fallback: use UTC today
        const now = new Date()
        const y = now.getUTCFullYear()
        const m = String(now.getUTCMonth() + 1).padStart(2, '0')
        const d = String(now.getUTCDate()).padStart(2, '0')
        startOfDay = `${y}-${m}-${d}T00:00:00.000Z`
        endOfDay   = `${y}-${m}-${d}T23:59:59.999Z`
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('orders')
        .select('amount_total')
        .in('status', ['paid', 'shipped', 'delivered'])
        .neq('customer_email', 'pending@stripe')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)

    if (error) {
        console.error('[today-revenue] Supabase error:', error)
        return NextResponse.json({ revenue: 0 })
    }

    const revenue = data?.reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0) || 0
    return NextResponse.json({ revenue })
}
