import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })
  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json([], { status: 403 })
  const { data: files } = await supabase.storage
    .from('product-images').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL +
    '/storage/v1/object/public/product-images/'
  const urls = (files ?? []).map(f => ({ name: f.name, url: base + f.name }))
  return NextResponse.json(urls)
}
