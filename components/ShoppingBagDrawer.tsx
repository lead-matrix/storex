"use client";

import { useCart } from "@/context/CartContext";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ShoppingBagDrawer() {
    const { cart, subtotal, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const router = useRouter();

    const FREE_SHIPPING_THRESHOLD = 75;
    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    const handleCheckout = () => {
        setIsCheckingOut(true);
        router.push("/checkout");
        setIsCartOpen(false);
        setIsCheckingOut(false);
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent className="bg-pearl border-l border-charcoal/10 w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-charcoal/10">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gold" />
                        SHOPPING BAG
                    </SheetTitle>

                    <div className="mt-4">
                        <div className="flex justify-between text-xs uppercase tracking-luxury mb-2 text-textsoft">
                            <span>{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping.toFixed(2)} more for free shipping` : "You've earned free shipping!"}</span>
                            <span>{freeShippingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-charcoal/5 w-full overflow-hidden rounded-full">
                            <div
                                className="h-full bg-gold transition-all duration-1000 ease-out"
                                style={{ width: `${freeShippingProgress}%` }}
                            />
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-grow p-6">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <ShoppingBag className="w-12 h-12 text-charcoal/20 mb-4" />
                            <p className="text-textsoft uppercase tracking-luxury text-sm font-medium">Your bag is empty</p>
                            <Button
                                variant="luxury"
                                className="mt-6 uppercase text-xs tracking-luxury font-medium"
                                onClick={() => setIsCartOpen(false)}
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4 group bg-white p-4 rounded-luxury shadow-soft border border-charcoal/5">
                                    <div className="relative w-24 h-24 bg-pearl flex-shrink-0 rounded-md overflow-hidden">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-heading text-lg font-medium text-charcoal tracking-luxury">{item.name}</h4>
                                            {item.variantName && (
                                                <p className="text-xs text-textsoft uppercase tracking-luxury mt-1">{item.variantName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center border border-charcoal/20 rounded px-2 py-1 bg-white">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-textsoft hover:text-charcoal transition-colors">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="mx-3 text-xs text-charcoal font-medium">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-textsoft hover:text-charcoal transition-colors">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="text-sm font-medium text-charcoal">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-textsoft/50 hover:text-red-600 transition-colors p-1 self-start">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {cart.length > 0 && (
                    <div className="p-6 border-t border-charcoal/10 bg-pearl/95 backdrop-blur-md space-y-4">
                        <div className="flex justify-between items-center text-xs uppercase tracking-luxury text-textsoft">
                            <span>Subtotal</span>
                            <span className="text-charcoal text-sm font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs uppercase tracking-luxury text-textsoft">
                            <span>Shipping</span>
                            <span className="text-charcoal text-sm font-medium">{subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "$10.00"}</span>
                        </div>
                        <Separator className="bg-charcoal/10 my-4" />
                        <div className="flex justify-between items-center text-sm uppercase tracking-luxury font-bold text-charcoal pt-2">
                            <span>Estimated Total</span>
                            <span className="text-gold text-xl">${(subtotal >= FREE_SHIPPING_THRESHOLD ? subtotal : subtotal + 10).toFixed(2)}</span>
                        </div>

                        <Button
                            variant="default"
                            className="w-full py-6 uppercase text-xs tracking-luxury font-bold mt-4"
                            disabled={isCheckingOut}
                            onClick={handleCheckout}
                        >
                            {isCheckingOut ? "Processing..." : "Secure Checkout"}
                        </Button>
                        <p className="text-[10px] text-center text-textsoft uppercase tracking-luxury mt-2">Complimentary returns on all orders</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
