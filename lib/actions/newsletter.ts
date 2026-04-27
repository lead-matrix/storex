'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function deleteSubscriber(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') throw new Error('Forbidden')

    const adminSupabase = await createAdminClient()
    await adminSupabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id)

    revalidatePath('/admin/marketing/subscribers')
}
