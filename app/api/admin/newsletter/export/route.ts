import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    // Auth guard
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

    // Fetch all subscribers
    const adminSupabase = await createAdminClient()
    const { data: subscribers } = await adminSupabase
        .from('newsletter_subscribers')
        .select('email, created_at')
        .order('created_at', { ascending: false })

    if (!subscribers) return new NextResponse('No data', { status: 404 })

    // Build CSV
    const rows = [
        ['Email', 'Subscribed Date'],
        ...subscribers.map(s => [
            s.email,
            new Date(s.created_at).toLocaleDateString('en-US')
        ])
    ]

    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        }
    })
}
