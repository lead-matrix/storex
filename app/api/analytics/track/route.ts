import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'edge';

// Free IP geolocation — no API key needed
async function getGeoFromIP(ip: string): Promise<{ country: string; country_code: string; city: string } | null> {
  try {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { country: 'Local', country_code: 'LO', city: 'Localhost' };
    }
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=country,countryCode,city,status`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;
    return { country: data.country, country_code: data.countryCode, city: data.city };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, referrer, user_agent, session_id } = body;

    // Get real IP (Vercel passes the real IP in x-forwarded-for)
    const ip =
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';

    const geo = await getGeoFromIP(ip);

    // Parse device type from user agent
    const ua = (user_agent || req.headers.get('user-agent') || '').toLowerCase();
    let device = 'desktop';
    if (/mobile|android|iphone|ipod/.test(ua)) device = 'mobile';
    else if (/tablet|ipad/.test(ua)) device = 'tablet';

    const supabase = await createAdminClient();
    await supabase.from('page_views').insert({
      path: path || '/',
      referrer: referrer || null,
      country: geo?.country || 'Unknown',
      country_code: geo?.country_code || 'XX',
      city: geo?.city || null,
      device,
      session_id: session_id || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Never fail silently — just return 200 so the beacon doesn't retry
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}
