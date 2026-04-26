'use client';
import { useState } from 'react';
import LiveAnalytics from './LiveAnalytics';

interface RevenueContentProps {
  children: React.ReactNode;
}

export default function AnalyticsTabs({ children }: RevenueContentProps) {
  const [tab, setTab] = useState<'revenue' | 'visitors'>('revenue');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/10 mb-6">
        {[
          { id: 'revenue', label: 'Revenue Intelligence' },
          { id: 'visitors', label: 'Live Web Analytics', dot: true },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'revenue' | 'visitors')}
            className={`
              relative px-5 py-3 text-[10px] uppercase tracking-widest font-semibold transition-all
              ${tab === t.id
                ? 'text-white border-b-2 border-gold -mb-px'
                : 'text-luxury-subtext hover:text-white/70 border-b-2 border-transparent -mb-px'
              }
            `}
          >
            {t.dot && (
              <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'revenue' && <div>{children}</div>}
      {tab === 'visitors' && <LiveAnalytics />}
    </div>
  );
}
