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
        <div className="bg-pearl p-8 rounded-luxury border border-charcoal/5 shadow-soft">
            <h2 className="text-sm font-heading uppercase tracking-luxury text-charcoal mb-6 font-medium">
                Order Summary
            </h2>

            <div className="space-y-6 mb-8">
                {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                        <div className="relative w-16 h-20 flex-shrink-0 bg-white rounded-md overflow-hidden border border-charcoal/10">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-charcoal text-white text-[10px] flex items-center justify-center rounded-full z-10 border-2 border-pearl">
                                {item.quantity}
                            </div>
                        </div>
                        <div className="flex-grow min-w-0 flex flex-col justify-center">
                            <p className="font-heading text-sm text-charcoal font-medium truncate tracking-luxury">{item.name}</p>
                            {item.variantName && (
                                <p className="text-xs uppercase tracking-luxury text-textsoft mt-1">{item.variantName}</p>
                            )}
                        </div>
                        <span className="text-sm text-charcoal font-medium flex-shrink-0 self-center">
                            ${(item.price * item.quantity).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="border-t border-charcoal/10 pt-6 space-y-4">
                {[
                    { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
                    { label: "Shipping", value: shipping === 0 ? "Complimentary" : `$${shipping.toFixed(2)}` },
                    { label: "Estimated Tax", value: `$${tax.toFixed(2)}` },
                ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs uppercase tracking-luxury text-textsoft">
                        <span>{row.label}</span>
                        <span className="text-charcoal font-medium">{row.value}</span>
                    </div>
                ))}

                <div className="flex justify-between pt-6 border-t border-charcoal/10 items-end">
                    <span className="text-xs uppercase tracking-luxury text-textsoft font-bold">Total</span>
                    <span className="font-heading text-2xl text-charcoal font-medium tracking-luxury">
                        ${total.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    )
}
