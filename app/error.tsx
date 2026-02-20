'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error(error);
    }, [error]);

    return (
        <div className="bg-background-primary text-text-bodyDark min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
            <div className="space-y-12 animate-in fade-in zoom-in duration-1000 max-w-lg">
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border border-rose-500/20 rounded-full animate-pulse" />
                    <AlertTriangle size={40} className="text-rose-500 opacity-80" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter text-text-headingDark uppercase leading-none">
                        Fault Detected
                    </h1>
                    <p className="text-text-mutedDark uppercase tracking-[0.4em] text-[10px] font-light">
                        A ritual has been interrupted
                    </p>
                </div>

                <div className="bg-background-secondary border border-gold-primary/5 p-6 space-y-4">
                    <p className="text-text-mutedDark text-[10px] uppercase tracking-[0.2em] leading-loose italic">
                        "Even in the Palace, the shadows occasionally shift out of alignment."
                    </p>
                    <p className="text-text-mutedDark/60 text-[9px] font-mono break-all opacity-50">
                        {error.message || "An unexpected architectural displacement has occurred."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-center">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center gap-3 text-gold-primary uppercase text-[10px] tracking-[0.4em] border border-gold-accent/30 px-8 py-4 hover:bg-gold-primary hover:text-background-primary transition-all duration-700 font-bold"
                    >
                        <RefreshCw size={14} className="animate-spin-slow" /> Retry Ritual
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 text-text-bodyDark uppercase text-[10px] tracking-[0.4em] border border-gold-primary/10 px-8 py-4 hover:border-gold-primary transition-all duration-700"
                    >
                        <Home size={14} /> Return To Palace
                    </Link>
                </div>
            </div>

            {/* Background Texture/Gradient */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-background-primary to-rose-950/10 opacity-30" />
            </div>
        </div>
    );
}