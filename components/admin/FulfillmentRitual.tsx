'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Package, MapPin, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { generateShippingLabel } from '@/app/admin/orders/actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface FulfillmentRitualProps {
    order: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function FulfillmentRitual({ order, isOpen, onOpenChange, onSuccess }: FulfillmentRitualProps) {
    const [step, setStep] = useState<'verify' | 'labels' | 'complete'>('verify')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ labelUrl: string, trackingNumber: string } | null>(null)

    const handleFulfillment = async () => {
        setLoading(true)
        try {
            const data = await generateShippingLabel(order.id)
            setResult(data)
            setStep('complete')
            toast.success('Ritual of Fulfillment Complete')
            onSuccess()
        } catch (err: any) {
            toast.error(err.message || 'The ritual has failed')
        } finally {
            setLoading(false)
        }
    }

    const resetRitual = () => {
        setStep('verify')
        setResult(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!loading) {
                if (!open) resetRitual()
                else onOpenChange(open)
            }
        }}>
            <DialogContent className="bg-obsidian border-luxury-border text-white sm:max-w-[600px] p-0 overflow-hidden">
                <div className="h-1.5 bg-gold/20 w-full">
                    <div
                        className="h-full bg-gold transition-all duration-700 ease-in-out"
                        style={{ width: step === 'verify' ? '33%' : step === 'labels' ? '66%' : '100%' }}
                    />
                </div>

                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-2xl font-serif italic tracking-luxury uppercase flex items-center gap-3">
                            <Package className="w-5 h-5 text-gold" />
                            Ritual of Fulfillment
                        </DialogTitle>
                        <DialogDescription className="text-white/40 uppercase tracking-[0.2em] text-[10px] mt-2">
                            Order #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'verify' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 p-5 rounded-luxury">
                                <h4 className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" /> Verify Manifest
                                </h4>
                                <div className="space-y-4">
                                    {order.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black/40 border border-white/10 rounded overflow-hidden relative">
                                                <Image
                                                    src={item.product_variants?.products?.images?.[0] || '/placeholder.png'}
                                                    alt="Asset"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-[11px] font-medium text-white">{item.product_variants?.products?.title}</p>
                                                <p className="text-[9px] text-white/40 uppercase tracking-widest">{item.product_variants?.name} • Quantity: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-5 rounded-luxury">
                                <h4 className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-4 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Destination
                                </h4>
                                <div className="text-[11px] text-white/60 space-y-1">
                                    <p className="text-white">{order.shipping_address?.name}</p>
                                    <p>{order.shipping_address?.line1} {order.shipping_address?.line2}</p>
                                    <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}</p>
                                    <p>{order.shipping_address?.country}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'complete' && result && (
                        <div className="py-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-serif italic text-white">Manifest Sealed</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-luxury">The order has been transitioned to the logistics stream.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-luxury flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-[9px] text-white/30 uppercase tracking-luxury font-bold">Tracking ID</p>
                                        <p className="font-mono text-gold text-sm uppercase">{result.trackingNumber}</p>
                                    </div>
                                    <Truck className="w-5 h-5 text-white/20" />
                                </div>

                                <a
                                    href={result.labelUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-gold text-black py-4 rounded-luxury text-[11px] font-bold uppercase tracking-luxury flex items-center justify-center gap-2 hover:bg-gold-light transition-all shadow-gold"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Print Shipping Artifact
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 pt-0 flex sm:justify-between items-center bg-black/20 border-t border-white/5">
                    {step === 'verify' && (
                        <>
                            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">Ready for logistics transition.</p>
                            <Button
                                onClick={handleFulfillment}
                                disabled={loading}
                                className="bg-gold text-black rounded-luxury hover:bg-gold-light transition-all px-8 py-6 text-[11px] font-bold uppercase tracking-luxury shadow-gold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Sealing...
                                    </>
                                ) : 'Commence Fulfillment'}
                            </Button>
                        </>
                    )}

                    {step === 'complete' && (
                        <Button
                            onClick={resetRitual}
                            className="w-full bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-luxury py-6 text-[11px] font-bold uppercase tracking-luxury"
                        >
                            Close Registry
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
