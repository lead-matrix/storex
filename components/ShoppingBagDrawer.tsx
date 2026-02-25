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
            <SheetContent className="bg-background-primary border-l border-gold-primary/10 w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-gold-primary/5">
                    <SheetTitle className="font-serif text-2xl tracking-widest text-text-headingDark flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gold-primary" />
                        SHOPPING BAG
                    </SheetTitle>

                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest mb-2 text-text-mutedDark">
                            <span>{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping.toFixed(2)} more for free shipping` : "You've earned free shipping!"}</span>
                            <span>{freeShippingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-background-secondary w-full overflow-hidden">
                            <div
                                className="h-full bg-gold-primary transition-all duration-1000 ease-out"
                                style={{ width: `${freeShippingProgress}%` }}
                            />
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-grow p-6">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <ShoppingBag className="w-12 h-12 text-text-mutedDark/10 mb-4" />
                            <p className="text-text-mutedDark/50 uppercase tracking-widest text-xs">Your bag is empty</p>
                            <Button
                                variant="outline"
                                className="mt-6 border-gold-accent text-gold-accent hover:bg-gold-primary hover:text-background-primary uppercase text-[10px] tracking-widest"
                                onClick={() => setIsCartOpen(false)}
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="relative w-24 h-24 bg-background-secondary flex-shrink-0">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-serif text-sm text-text-headingDark uppercase tracking-wider">{item.name}</h4>
                                            {item.variantName && (
                                                <p className="text-[10px] text-text-mutedDark uppercase tracking-widest mt-1">{item.variantName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center border border-gold-primary/10 px-2 py-1">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-text-mutedDark hover:text-gold-primary transition-colors">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="mx-3 text-[10px] text-text-bodyDark font-medium">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-text-mutedDark hover:text-gold-primary transition-colors">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="text-sm font-light text-text-bodyDark">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-text-mutedDark/20 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {cart.length > 0 && (
                    <div className="p-6 border-t border-gold-primary/5 bg-background-primary/50 backdrop-blur-sm space-y-4">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-text-mutedDark">
                            <span>Subtotal</span>
                            <span className="text-text-headingDark text-sm font-light">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-text-mutedDark">
                            <span>Shipping</span>
                            <span className="text-text-headingDark text-sm font-light">{subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "$10.00"}</span>
                        </div>
                        <Separator className="bg-gold-primary/5" />
                        <div className="flex justify-between items-center text-xs uppercase tracking-[0.3em] font-medium text-text-headingDark pt-2">
                            <span>Estimated Total</span>
                            <span className="text-gold-primary text-lg">${(subtotal >= FREE_SHIPPING_THRESHOLD ? subtotal : subtotal + 10).toFixed(2)}</span>
                        </div>

                        <Button
                            className="w-full bg-gold-primary text-background-primary hover:bg-gold-hover transition-all duration-500 py-6 uppercase text-[10px] tracking-[0.4em] font-bold mt-4"
                            disabled={isCheckingOut}
                            onClick={handleCheckout}
                        >
                            {isCheckingOut ? "Processing..." : "Secure Checkout"}
                        </Button>
                        <p className="text-[9px] text-center text-text-mutedDark/30 uppercase tracking-widest">Complimentary returns on all orders</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
