import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTrackingInfo } from '@/lib/utils/shippo';
import { ShippoTracking, ShippoTrackingHistoryItem } from '@/types/order';
import { CheckCircle2, Package, Truck, Home, MapPin, Loader2 } from 'lucide-react';

interface TrackingPageProps {
    params: Promise<{ trackingNumber: string }>;
}

/**
 * Branded Tracking Page for Dina Cosmetic
 * Aesthetic: Obsidian background with Gold accents.
 * Luxury feel, timeline with status details.
 */
async function TrackingResult({ trackingNumber }: { trackingNumber: string }) {
    const supabase = await createClient();

    // 1. Find Order to get Carrier (required for track.get)
    const { data: order } = await supabase
        .from('orders')
        .select('carrier, customer_email, status')
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

    if (!order) {
        // Fallback: If not in DB, show not found or try common carriers?
        // Let's assume most are USPS/UPS/FedEx. Shippo's API might require carrier.
        // If we don't have carrier, we can't fetch fresh from Shippo without it.
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 px-6">
                <Package className="w-12 h-12 text-[#D4AF37] opacity-50" />
                <h2 className="text-2xl font-playfair text-[#D4AF37]">Artifact Not Found</h2>
                <p className="text-[#F5F4F0]/60 max-w-sm">
                    We could not locate this tracking number in our records. 
                    Please ensure the ID is correct or contact support.
                </p>
                <a href="/account/orders" className="text-[#D4AF37] underline underline-offset-4 text-sm uppercase tracking-widest">
                    Return to Rituals
                </a>
            </div>
        );
    }

    // 2. Fetch fresh data from Shippo
    const carrier = order.carrier || 'usps'; // Fallback to usps if not set
    let tracking: ShippoTracking | null = null;
    try {
        tracking = await getTrackingInfo(carrier, trackingNumber) as ShippoTracking;
    } catch (err) {
        console.error('[Track Page] Shippo Fetch Error:', err);
    }

    if (!tracking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 px-6">
                <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin opacity-50" />
                <h2 className="text-2xl font-playfair text-[#D4AF37]">Tracking Unavailable</h2>
                <p className="text-[#F5F4F0]/60 max-w-sm">
                    Carrier details are currently pending sync. Please check back in a few moments.
                </p>
            </div>
        );
    }

    const currentStatus = tracking.tracking_status?.status || 'UNKNOWN';
    const history = [...tracking.tracking_history].reverse(); // Most recent first for timeline?
    // Actually, usually timeline shows 'Most recent first' at top.

    const statusMap: Record<string, { icon: any, label: string }> = {
        'UNKNOWN': { icon: Loader2, label: 'Preparation' },
        'PRE_TRANSIT': { icon: Package, label: 'Manifested' },
        'TRANSIT': { icon: Truck, label: 'En Route' },
        'OUT_FOR_DELIVERY': { icon: Truck, label: 'Incoming' },
        'DELIVERED': { icon: Home, label: 'Manifested' },
        'RETURNED': { icon: Home, label: 'Returned' },
        'FAILURE': { icon: Package, label: 'Exception' },
    };

    const statusConfig = statusMap[currentStatus] || statusMap['UNKNOWN'];

    return (
        <div className="max-w-xl mx-auto space-y-12">
            {/* Summary Card */}
            <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-8 rounded-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 group-hover:scale-125 transition-transform duration-1000">
                    <statusConfig.icon className="w-24 h-24 text-[#D4AF37]" strokeWidth={1} />
                </div>
                
                <div className="relative z-10 space-y-4">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-medium">Tracking Manifest</p>
                    <h1 className="text-4xl font-playfair text-[#F5F4F0]">{statusConfig.label}</h1>
                    <div className="flex items-center gap-3 text-sm text-[#F5F4F0]/60 font-mono tracking-widest uppercase">
                        <span>{carrier}</span>
                        <span className="w-1 h-1 rounded-full bg-[#D4AF37]/40" />
                        <span>{trackingNumber}</span>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/60 font-medium px-4">Timeline</p>
                <div className="relative pl-8 space-y-10">
                    {/* Vertical Line */}
                    <div className="absolute left-3.5 top-2 bottom-2 w-[1px] bg-gradient-to-b from-[#D4AF37]/40 via-[#D4AF37]/10 to-transparent" />

                    {history.map((event, idx) => {
                        const isLatest = idx === 0;
                        const eventStatus = event.status || 'UNKNOWN';
                        const isDelivered = eventStatus === 'DELIVERED';
                        
                        return (
                            <div key={event.object_id || idx} className="relative group">
                                {/* Dot */}
                                <div className={`absolute -left-6.5 top-1.5 w-4 h-4 rounded-full border border-[#D4AF37]/50 flex items-center justify-center bg-[#0B0B0D] z-10
                                    ${isLatest ? 'shadow-[0_0_15px_rgba(212,175,55,0.3)] border-[#D4AF37]' : 'opacity-40'}
                                `}>
                                    {isDelivered && isLatest ? (
                                        <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                                    ) : (
                                        <div className={`w-1 h-1 rounded-full ${isLatest ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/50'}`} />
                                    )}
                                </div>

                                <div className={`space-y-1 ${isLatest ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`}>
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-xs font-mono tracking-widest uppercase text-[#F5F4F0]/40">
                                            {new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(event.status_date))}
                                        </p>
                                        {event.location && (
                                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-tighter text-[#D4AF37]/60">
                                                <MapPin className="w-2.5 h-2.5" />
                                                <span>{event.location.city}, {event.location.state}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`font-playfair text-lg leading-tight ${isLatest ? 'text-[#D4AF37]' : 'text-[#F5F4F0]'}`}>
                                        {event.status_details || event.status}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Support Call-to-action */}
            <div className="text-center pt-8 border-t border-[#D4AF37]/10 space-y-4">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#F5F4F0]/30">Questions regarding arrival?</p>
                <div className="flex items-center justify-center gap-6">
                    <a href="mailto:dinaecosmetic@gmail.com" className="text-xs uppercase tracking-widest text-[#D4AF37] hover:text-[#F5F4F0] transition-colors">Contact Artisans</a>
                    <span className="w-1 h-1 rounded-full bg-[#D4AF37]/20" />
                    <a href="/shop" className="text-xs uppercase tracking-widest text-[#F5F4F0]/60 hover:text-[#D4AF37] transition-colors">Continue Collection</a>
                </div>
            </div>
        </div>
    );
}

export default async function TrackingPage({ params }: TrackingPageProps) {
    const { trackingNumber } = await params;

    return (
        <div className="min-h-screen bg-[#0B0B0D] py-24 px-6 md:px-0">
            <Suspense fallback={
                <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin opacity-20" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/40">Manifesting Details...</p>
                </div>
            }>
                <TrackingResult trackingNumber={trackingNumber} />
            </Suspense>
        </div>
    );
}
