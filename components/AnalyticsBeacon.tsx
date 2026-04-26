'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Generates or retrieves a persistent anonymous session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'dina_sid';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function AnalyticsBeacon() {
  const pathname = usePathname();
  const lastPath = useRef<string>('');

  useEffect(() => {
    // Skip tracking admin pages
    if (pathname.startsWith('/admin')) return;
    // Skip if same path (StrictMode double-fire guard)
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const payload = {
      path: pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
    };

    // Use sendBeacon for reliability (works even if tab closes)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload));
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
