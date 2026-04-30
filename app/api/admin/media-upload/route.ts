import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Use admin client for storage — service role bypasses bucket RLS policies
    const { createClient: createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = await createAdminClient()

    // Sanitize filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `builder/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    const { data, error } = await adminSupabase.storage
      .from('product-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true
      })


    if (error) {
      console.error('Storage error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${data.path}`

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('[MEDIA_UPLOAD_POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
