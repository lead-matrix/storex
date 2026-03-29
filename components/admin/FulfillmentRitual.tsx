'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Truck, Package, MapPin, CheckCircle2, Loader2, ExternalLink, ChevronRight, Zap, AlertCircle } from 'lucide-react'
import { fetchShippingRatesAction, completeFulfillmentAction } from '@/app/admin/orders/actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface Rate {
    id: string
    provider: string
    service: string
    amount: string
    estimatedDays: number
    provider_image: string
}

interface FulfillmentRitualProps {
    order: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function FulfillmentRitual({ order, isOpen, onOpenChange, onSuccess }: FulfillmentRitualProps) {
    const [step, setStep] = useState<'verify' | 'rates' | 'complete'>('verify')
    const [loading, setLoading] = useState(false)
    const [rates, setRates] = useState<Rate[]>([])
    const [selectedRate, setSelectedRate] = useState<Rate | null>(null)
    const [parcelName, setParcelName] = useState<string>('')
    const [result, setResult] = useState<{ labelUrl: string, trackingNumber: string } | null>(null)

    // Partial Fulfillment State: { order_item_id: quantity_to_ship_now }
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})

    // Initialize items to fulfill when order is selected
    useEffect(() => {
        if (order?.order_items) {
            const initial: Record<string, number> = {}
            order.order_items.forEach((item: any) => {
                const remaining = (item.quantity || 0) - (item.fulfilled_quantity || 0)
                if (remaining > 0) {
                    initial[item.id] = remaining
                } else {
                    initial[item.id] = 0
                }
            })
            setSelectedItems(initial)
        }
    }, [order])

    const handleQuantityChange = (itemId: string, val: number, max: number) => {
        const quantity = Math.max(0, Math.min(val, max))
        setSelectedItems(prev => ({ ...prev, [itemId]: quantity }))
    }

    const itemsToShipArray = Object.entries(selectedItems)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ id, quantity: qty }))

    // Determine recommended rate based on address country + chosen Stripe shipping display name
    const getRecommendedRate = (rateList: Rate[]) => {
        const country = order?.shipping_address?.country || 'US'
        const isUS = country === 'US'
        // Detect express from the chosen Stripe shipping option name stored in metadata
        const shippingLabel: string = (
            order?.metadata?.shipping_label ||
            order?.metadata?.shipping_option ||
            ''
        ).toLowerCase()
        const isExpress = shippingLabel.includes('express') || shippingLabel.includes('dhl')

        const recommended = rateList.find(r => {
            if (isUS) {
                if (isExpress) return r.provider === 'USPS' && r.service.toLowerCase().includes('express')
                return r.provider === 'USPS' && (r.service.toLowerCase().includes('priority') || r.service.toLowerCase().includes('ground'))
            } else {
                if (isExpress) return r.provider === 'DHL' || r.service.toLowerCase().includes('express')
                return r.provider === 'USPS' && r.service.toLowerCase().includes('international')
            }
        })

        return recommended || rateList[0] || null
    }

    const handleFetchRates = async () => {
        if (itemsToShipArray.length === 0) {
            toast.error("Manifest is empty. Select assets to include.")
            return
        }

        setLoading(true)
        try {
            const data = await fetchShippingRatesAction(order.id, itemsToShipArray)
            setRates(data.rates)
            setParcelName(data.parcelName || 'Standard Box')
            // Auto-select recommended rate
            const recommended = getRecommendedRate(data.rates)
            setSelectedRate(recommended)
            setStep('rates')
            toast.success('Logistics matrix synchronized')
        } catch (err: any) {
            toast.error(err.message || 'Matrix synchronization failed')
        } finally {
            setLoading(false)
        }
    }

    const handlePurchase = async () => {
        if (!selectedRate) return
        setLoading(true)
        try {
            const data = await completeFulfillmentAction(
                order.id,
                selectedRate.id,
                selectedRate.provider,
                selectedRate.service,
                itemsToShipArray
            )
            setResult({
                labelUrl: data.labelUrl || '',
                trackingNumber: data.trackingNumber || ''
            })
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
        setRates([])
        setSelectedRate(null)
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
            <DialogContent aria-describedby={undefined} className="bg-obsidian border-luxury-border text-white sm:max-w-[700px] p-0 overflow-hidden">
                <div className="h-1.5 bg-gold/20 w-full">
                    <div
                        className="h-full bg-gold transition-all duration-700 ease-in-out"
                        style={{ width: step === 'verify' ? '33%' : step === 'rates' ? '66%' : '100%' }}
                    />
                </div>

                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-2xl font-serif italic tracking-luxury uppercase flex items-center gap-3">
                            <Package className="w-5 h-5 text-gold" />
                            Ritual of Partial Fulfillment
                        </DialogTitle>
                        <DialogDescription className="text-white/40 uppercase tracking-[0.2em] text-[10px] mt-2">
                            Order #{order.id.slice(0, 8).toUpperCase()} • Fragmented Logistics Stream
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'verify' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 p-5 rounded-luxury">
                                <h4 className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" /> Select Artifacts for this Parcel
                                </h4>
                                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {order.order_items?.map((item: any) => {
                                        const remaining = (item.quantity || 0) - (item.fulfilled_quantity || 0)
                                        return (
                                            <div key={item.id} className={`flex items-center gap-4 p-3 rounded-luxury transition-all ${selectedItems[item.id] > 0 ? 'bg-gold/5 border border-gold/20' : 'bg-black/20 border border-transparent opacity-60'}`}>
                                                <div className="w-12 h-12 bg-black/40 border border-white/10 rounded overflow-hidden relative flex-shrink-0">
                                                    <Image
                                                        src={item.product_variants?.products?.images?.[0] || '/placeholder.png'}
                                                        alt="Asset"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="text-[10px] font-medium text-white truncate">{item.product_variants?.products?.title}</p>
                                                    <p className="text-[8px] text-white/40 uppercase tracking-widest">{item.product_variants?.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[7px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                            Total: {item.quantity}
                                                        </span>
                                                        <span className="text-[7px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                            Shipped: {item.fulfilled_quantity || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">To Ship</p>
                                                        <div className="flex items-center bg-black/40 border border-white/10 rounded-sm overflow-hidden">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, selectedItems[item.id] - 1, remaining)}
                                                                className="px-2 py-2 min-w-[44px] min-h-[44px] text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
                                                            >-</button>
                                                            <input
                                                                type="number"
                                                                value={selectedItems[item.id] || 0}
                                                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0, remaining)}
                                                                className="w-10 bg-transparent text-center text-[10px] font-bold text-gold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, selectedItems[item.id] + 1, remaining)}
                                                                className="px-2 py-2 min-w-[44px] min-h-[44px] text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
                                                                disabled={selectedItems[item.id] >= remaining}
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {Object.values(selectedItems).every(v => v === 0) && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-[9px] text-red-400 uppercase tracking-luxury animate-pulse">
                                        <AlertCircle size={10} />
                                        You must designate artifacts for transport.
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 border border-white/10 p-5 rounded-luxury">
                                <h4 className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-4 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Destination Registry
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

                    {step === 'rates' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] uppercase tracking-luxury text-gold font-bold">Select Logistics Stream</h4>
                                <div className="flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full">
                                    <Package className="w-3 h-3 text-gold" />
                                    <span className="text-[9px] uppercase tracking-widest text-gold font-bold">{parcelName} Selected</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {rates.map((rate) => {
                                    const isRecommended = selectedRate?.id === rate.id && rates.indexOf(rate) === rates.findIndex(r => r.id === selectedRate?.id)
                                    const recommended = getRecommendedRate(rates)
                                    const isThisRecommended = recommended?.id === rate.id
                                    return (
                                        <button
                                            key={rate.id}
                                            onClick={() => setSelectedRate(rate)}
                                            className={`group flex items-center justify-between p-4 rounded-luxury border transition-all ${selectedRate?.id === rate.id
                                                ? 'bg-gold/10 border-gold shadow-gold-sm'
                                                : 'bg-white/5 border-white/10 hover:border-gold/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white p-1 rounded-sm flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                                                    <Image src={rate.provider_image} alt={rate.provider} width={30} height={30} className="object-contain" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">{rate.provider} {rate.service}</p>
                                                        {isThisRecommended && (
                                                            <span className="text-[7px] bg-gold/20 text-gold border border-gold/30 px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-bold">
                                                                ✓ RECOMMENDED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[8px] text-white/40 uppercase tracking-widest">Estimated: {rate.estimatedDays} Days</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-serif text-gold">${rate.amount}</p>
                                                {rate.amount === Math.min(...rates.map(r => Number(r.amount))).toString() && (
                                                    <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Best Value</span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {step === 'complete' && result && (
                        <div className="py-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-serif italic text-white">Parcel Manifest Sealed</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-luxury">The partial shipment has been transitioned to the logistics stream.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 max-w-[400px] mx-auto">
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
                            <div className="text-left">
                                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">Ready for matrix sync.</p>
                                <p className="text-[11px] font-serif text-gold italic">
                                    {itemsToShipArray.length} items ({itemsToShipArray.reduce((acc, row) => {
                                        const originalItem = order.order_items?.find((i: any) => i.id === row.id);
                                        const w1 = originalItem?.product_variants?.products?.weight_oz || 0;
                                        const w2 = originalItem?.product_variants?.weight || 0;
                                        return acc + (row.quantity * (w2 || w1 || 0.5));
                                    }, 0).toFixed(2)} oz)
                                </p>
                            </div>
                            <Button
                                onClick={handleFetchRates}
                                disabled={loading || itemsToShipArray.length === 0}
                                className="bg-gold text-black rounded-luxury hover:bg-gold-light transition-all px-8 py-6 text-[11px] font-bold uppercase tracking-luxury shadow-gold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        Compare Streams
                                        <ChevronRight size={14} className="ml-2" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {step === 'rates' && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setStep('verify')}
                                className="text-white/40 hover:text-white uppercase tracking-widest text-[9px]"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handlePurchase}
                                disabled={loading || !selectedRate}
                                className="bg-gold text-black rounded-luxury hover:bg-gold-light transition-all px-8 py-6 text-[11px] font-bold uppercase tracking-luxury shadow-gold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Purchasing...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={14} className="mr-2" />
                                        Authorize {selectedRate?.provider} Label
                                    </>
                                )}
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
