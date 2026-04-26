'use client';
import { useEffect, useState, useCallback } from 'react';
import WorldMap from './WorldMap';

interface AnalyticsStats {
  active_now: number;
  today_views: number;
  countries: { country: string; country_code: string; count: number }[];
  pages: { path: string; count: number }[];
  devices: { device: string; count: number }[];
  referrers: { source: string; count: number }[];
  daily_views: number[];
}

function Sparkline({ data, color = '#D4AF37', h = 50 }: { data: number[]; color?: string; h?: number }) {
  const max = Math.max(...data, 1);
  const w = 280; const pad = 6;
  const step = (w - pad * 2) / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => ({ x: pad + i * step, y: h - pad - ((v / max) * (h - pad * 2)) }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${h - pad} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg1)" />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} stroke="#050505" strokeWidth="1.5" />)}
    </svg>
  );
}

const DEVICE_ICONS: Record<string, string> = { desktop: '🖥️', mobile: '📱', tablet: '⬛' };

export default function LiveAnalytics() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/stats', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxCountry = stats ? Math.max(...stats.countries.map(c => c.count), 1) : 1;
  const totalDevices = stats ? stats.devices.reduce((s, d) => s + d.count, 0) : 0;

  return (
    <div className="space-y-5 mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[11px] uppercase tracking-widest text-white font-semibold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-emerald-400 inline-block transition-all ${pulse ? 'scale-150' : 'scale-100'}`} />
            Live Web Analytics
          </h2>
          <p className="text-[9px] text-luxury-subtext mt-0.5 uppercase tracking-widest">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'} · Refreshes every 30s
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="text-[9px] uppercase tracking-widest text-gold border border-gold/30 px-3 py-1.5 rounded hover:bg-gold/10 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0B0B0D] rounded-luxury border border-white/10 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <div className="text-center py-12 text-luxury-subtext/50 text-[10px] uppercase tracking-widest">
          No analytics data yet — visitors will appear here once the site receives traffic.
        </div>
      ) : (
        <>
          {/* Live KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Active Right Now',
                value: stats.active_now.toString(),
                sub: 'Visitors in last 5 min',
                accent: true,
                dot: true,
              },
              {
                label: "Today's Page Views",
                value: stats.today_views.toLocaleString(),
                sub: 'Last 24 hours',
              },
              {
                label: 'Countries Reached',
                value: stats.countries.length.toString(),
                sub: 'Last 30 days',
              },
              {
                label: 'Top Device',
                value: stats.devices.length > 0
                  ? `${DEVICE_ICONS[stats.devices.sort((a, b) => b.count - a.count)[0]?.device] ?? ''} ${stats.devices.sort((a, b) => b.count - a.count)[0]?.device ?? '—'}`
                  : '—',
                sub: 'Most common device',
              },
            ].map(k => (
              <div
                key={k.label}
                className="bg-[#0B0B0D] rounded-luxury border border-white/10 p-5 shadow-sm hover:border-gold/30 transition-all group"
              >
                <p className="text-[9px] uppercase tracking-[0.3em] text-luxury-subtext mb-2 font-medium flex items-center gap-1.5">
                  {k.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  )}
                  {k.label}
                </p>
                <p className={`text-2xl font-serif capitalize ${k.accent ? 'text-emerald-400' : 'text-white group-hover:text-gold transition-colors'}`}>
                  {k.value}
                </p>
                <p className="text-[9px] text-luxury-subtext/70 mt-1.5 tracking-wide uppercase font-medium">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* World Map */}
          <div className="bg-[#0B0B0D] rounded-luxury border border-white/10 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[11px] uppercase tracking-widest text-white font-semibold">Visitors Across the Globe</h3>
                <p className="text-[9px] text-luxury-subtext mt-0.5 uppercase tracking-widest">Last 30 days · Dot size = relative traffic</p>
              </div>
            </div>
            <WorldMap countries={stats.countries} maxCount={maxCountry} />
            {/* Country legend */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {stats.countries.slice(0, 10).map((c) => (
                <div key={c.country_code} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-gold flex-shrink-0"
                    style={{ opacity: 0.4 + (c.count / maxCountry) * 0.6 }}
                  />
                  <span className="text-[9px] text-luxury-subtext truncate">{c.country}</span>
                  <span className="text-[9px] text-white ml-auto font-mono">{c.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Page views sparkline + top pages + devices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 7-day sparkline */}
            <div className="bg-[#0B0B0D] rounded-luxury border border-white/10 p-5 shadow-sm">
              <h3 className="text-[11px] uppercase tracking-widest text-white font-semibold mb-1">Page Views</h3>
              <p className="text-[9px] text-luxury-subtext uppercase tracking-widest mb-4">Last 7 Days</p>
              <Sparkline data={stats.daily_views} h={80} />
              <div className="flex justify-between mt-2">
                {DAYS.map(d => (
                  <span key={d} className="text-[9px] text-luxury-subtext uppercase">{d}</span>
                ))}
              </div>
              <p className="text-xl font-serif text-gold mt-3">
                {stats.daily_views.reduce((s, v) => s + v, 0).toLocaleString()}
                <span className="text-[9px] text-luxury-subtext ml-1 font-sans uppercase tracking-wider">total</span>
              </p>
            </div>

            {/* Top pages */}
            <div className="bg-[#0B0B0D] rounded-luxury border border-white/10 p-5 shadow-sm">
              <h3 className="text-[11px] uppercase tracking-widest text-white font-semibold mb-1">Top Pages</h3>
              <p className="text-[9px] text-luxury-subtext uppercase tracking-widest mb-4">Last 7 Days</p>
              {stats.pages.length === 0 ? (
                <p className="text-[9px] text-luxury-subtext/50 uppercase tracking-widest">No data yet</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.pages.slice(0, 7).map((p, i) => {
                    const pct = Math.round((p.count / (stats.pages[0]?.count || 1)) * 100);
                    return (
                      <div key={p.path}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-white truncate max-w-[70%]">
                            {p.path === '/' ? '/ (Home)' : p.path}
                          </span>
                          <span className="text-[9px] text-luxury-subtext font-mono">{p.count}</span>
                        </div>
                        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gold/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Devices + Referrers */}
            <div className="space-y-5">
              {/* Devices */}
              <div className="bg-[#0B0B0D] rounded-luxury border border-white/10 p-5 shadow-sm">
                <h3 className="text-[11px] uppercase tracking-widest text-white font-semibold mb-3">Devices</h3>
                <div className="space-y-2">
                  {stats.devices.length === 0 ? (
                    <p className="text-[9px] text-luxury-subtext/50 uppercase tracking-widest">No data yet</p>
                  ) : stats.devices.sort((a, b) => b.count - a.count).map((d) => {
                    const pct = totalDevices > 0 ? Math.round((d.count / totalDevices) * 100) : 0;
                    return (
                      <div key={d.device} className="flex items-center gap-2">
                        <span className="text-sm">{DEVICE_ICONS[d.device] ?? '💻'}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[9px] text-white capitalize">{d.device}</span>
                            <span className="text-[9px] text-luxury-subtext">{pct}%</span>
                          </div>
                          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gold/50 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top referrers */}
              <div className="bg-[#0B0B0D] rounded-luxury border border-white/10 p-5 shadow-sm">
                <h3 className="text-[11px] uppercase tracking-widest text-white font-semibold mb-3">Traffic Sources</h3>
                {stats.referrers.length === 0 ? (
                  <p className="text-[9px] text-luxury-subtext/50 uppercase tracking-widest">Direct / no referrer data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.referrers.slice(0, 5).map((r) => (
                      <div key={r.source} className="flex items-center justify-between">
                        <span className="text-[9px] text-white truncate">{r.source}</span>
                        <span className="text-[9px] text-luxury-subtext font-mono">{r.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
