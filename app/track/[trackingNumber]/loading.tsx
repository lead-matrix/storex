import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0B0B0D] flex flex-col items-center justify-center space-y-4 px-6">
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin opacity-20" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/40">Gathering Manifest...</p>
        </div>
    );
}
