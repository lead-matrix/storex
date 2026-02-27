"use client"

import Image from "next/image"

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image: string
    variantName?: string
}

interface OrderSummaryProps {
    cart: CartItem[]
    subtotal: number
    shipping: number
    tax: number
    total: number
}

export function OrderSummary({ cart, subtotal, shipping, tax, total }: OrderSummaryProps) {
    return (
        <div className="bg-[#0f0f0f] p-8 md:p-12 border border-white/10 shadow-2xl">
            <h2 className="text-xl font-serif uppercase tracking-widest text-white mb-8 border-b border-white/10 pb-4">
                Manifest
            </h2>

            <div className="space-y-6 mb-10">
                {cart.map((item) => (
                    <div key={item.id} className="flex gap-6 group items-center">
                        <div className="relative w-20 h-24 flex-shrink-0 bg-black rounded-lg overflow-hidden border border-white/5">
                            <Image src={item.image} alt={item.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-0 right-0 w-6 h-6 bg-gold text-black text-[10px] font-bold flex items-center justify-center rounded-bl-lg">
                                {item.quantity}
                            </div>
                        </div>
                        <div className="flex-grow min-w-0 flex flex-col justify-center">
                            <p className="font-serif text-sm text-white uppercase tracking-widest truncate">{item.name}</p>
                            {item.variantName && (
                                <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-subtext mt-2">{item.variantName}</p>
                            )}
                        </div>
                        <span className="text-sm text-gold font-medium flex-shrink-0">
                            ${(item.price * item.quantity).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="border-t border-white/10 pt-8 space-y-6">
                {[
                    { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
                    { label: "Shipping", value: shipping === 0 ? "Complimentary" : `$${shipping.toFixed(2)}` },
                    { label: "Estimated Tax", value: `$${tax.toFixed(2)}` },
                ].map((row) => (
                    <div key={row.label} className="flex justify-between text-[11px] uppercase tracking-[0.3em] text-luxury-subtext">
                        <span>{row.label}</span>
                        <span className="text-white">{row.value}</span>
                    </div>
                ))}

                <div className="flex justify-between pt-8 border-t border-gold/20 items-end">
                    <span className="text-xs uppercase tracking-[0.4em] text-gold font-bold">Total Request</span>
                    <span className="font-serif text-3xl text-white tracking-widest">
                        ${total.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    )
}
