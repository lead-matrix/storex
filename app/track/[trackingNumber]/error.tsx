'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Track Page Error]', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0B0B0D] flex flex-col items-center justify-center text-center space-y-6 px-6">
            <div className="p-4 rounded-full bg-[#D4AF37]/5">
                <AlertTriangle className="w-12 h-12 text-[#D4AF37] opacity-50" />
            </div>
            
            <div className="space-y-2">
                <h2 className="text-2xl font-playfair text-[#D4AF37]">Connection Manifest Error</h2>
                <p className="text-[#F5F4F0]/40 max-w-sm text-sm">
                    We encountered a disturbance in the tracking collection. Please attempt your search again.
                </p>
            </div>

            <button
                onClick={() => reset()}
                className="flex items-center gap-2 px-6 py-3 border border-[#D4AF37]/30 text-[#D4AF37] text-xs uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#000] transition-all duration-300"
            >
                <RotateCcw className="w-3 h-3" />
                Retry Manifest
            </button>
        </div>
    );
}
