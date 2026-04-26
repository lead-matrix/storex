import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSb = await createAdminClient();
  const now = new Date();
  const minus5min = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const minus7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const minus30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: activeNow },
    { data: today },
    { data: byCountry },
    { data: topPages },
    { data: byDevice },
    { data: byReferrer },
    { data: last7d },
  ] = await Promise.all([
    // Active visitors right now (last 5 min, distinct sessions)
    adminSb.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', minus5min),
    // Today's page views
    adminSb.from('page_views').select('created_at').gte('created_at', minus24h),
    // Visitors by country (last 30 days)
    adminSb.from('page_views').select('country, country_code').gte('created_at', minus30d),
    // Top pages (last 7 days)
    adminSb.from('page_views').select('path').gte('created_at', minus7d),
    // Device breakdown (last 7 days)
    adminSb.from('page_views').select('device').gte('created_at', minus7d),
    // Top referrers (last 7 days)
    adminSb.from('page_views').select('referrer').gte('created_at', minus7d).not('referrer', 'is', null),
    // Last 7 days hourly (for sparkline)
    adminSb.from('page_views').select('created_at').gte('created_at', minus7d),
  ]);

  // Aggregate country counts
  const countryMap: Record<string, { country: string; country_code: string; count: number }> = {};
  byCountry?.forEach((r: any) => {
    const key = r.country_code;
    if (!countryMap[key]) countryMap[key] = { country: r.country, country_code: r.country_code, count: 0 };
    countryMap[key].count++;
  });
  const countries = Object.values(countryMap).sort((a, b) => b.count - a.count).slice(0, 20);

  // Aggregate top pages
  const pageMap: Record<string, number> = {};
  topPages?.forEach((r: any) => { pageMap[r.path] = (pageMap[r.path] || 0) + 1; });
  const pages = Object.entries(pageMap).sort(([, a], [, b]) => b - a).slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  byDevice?.forEach((r: any) => { deviceMap[r.device] = (deviceMap[r.device] || 0) + 1; });
  const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));

  // Referrers
  const refMap: Record<string, number> = {};
  byReferrer?.forEach((r: any) => {
    if (!r.referrer) return;
    try {
      const host = new URL(r.referrer).hostname.replace('www.', '');
      refMap[host] = (refMap[host] || 0) + 1;
    } catch { /* skip malformed */ }
  });
  const referrers = Object.entries(refMap).sort(([, a], [, b]) => b - a).slice(0, 8)
    .map(([source, count]) => ({ source, count }));

  // Daily sparkline for last 7 days
  const dailyMap: Record<string, number> = {};
  last7d?.forEach((r: any) => {
    const day = r.created_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  });
  const dailyViews = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return dailyMap[key] || 0;
  });

  return NextResponse.json({
    active_now: activeNow ?? 0,
    today_views: today?.length ?? 0,
    countries,
    pages,
    devices,
    referrers,
    daily_views: dailyViews,
  });
}
