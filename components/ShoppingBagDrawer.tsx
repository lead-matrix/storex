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

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: cart }),
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                // Fallback or error handling
                console.error("No checkout URL returned");
            }
        } catch (error) {
            console.error("Checkout error:", error);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent className="bg-black border-l border-white/10 w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-white/5">
                    <SheetTitle className="font-serif text-2xl tracking-widest text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gold" />
                        SHOPPING BAG
                    </SheetTitle>

                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest mb-2 text-white/50">
                            <span>{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping.toFixed(2)} more for free shipping` : "You've earned free shipping!"}</span>
                            <span>{freeShippingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-white/5 w-full overflow-hidden">
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
                            <ShoppingBag className="w-12 h-12 text-white/10 mb-4" />
                            <p className="text-white/50 uppercase tracking-widest text-xs">Your bag is empty</p>
                            <Button
                                variant="outline"
                                className="mt-6 border-gold text-gold hover:bg-gold hover:text-black uppercase text-[10px] tracking-widest"
                                onClick={() => setIsCartOpen(false)}
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="relative w-24 h-24 bg-white/5 flex-shrink-0">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-serif text-sm text-white uppercase tracking-wider">{item.name}</h4>
                                            {item.variantName && (
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{item.variantName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center border border-white/10 px-2 py-1">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white/40 hover:text-gold transition-colors">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="mx-3 text-[10px] text-white font-medium">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white/40 hover:text-gold transition-colors">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="text-sm font-light text-white">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {cart.length > 0 && (
                    <div className="p-6 border-t border-white/5 bg-black/50 backdrop-blur-sm space-y-4">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-white/50">
                            <span>Subtotal</span>
                            <span className="text-white text-sm font-light">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-white/50">
                            <span>Shipping</span>
                            <span className="text-white text-sm font-light">{subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "$10.00"}</span>
                        </div>
                        <Separator className="bg-white/5" />
                        <div className="flex justify-between items-center text-xs uppercase tracking-[0.3em] font-medium text-white pt-2">
                            <span>Estimated Total</span>
                            <span className="text-gold text-lg">${(subtotal >= FREE_SHIPPING_THRESHOLD ? subtotal : subtotal + 10).toFixed(2)}</span>
                        </div>

                        <Button
                            className="w-full bg-gold text-black hover:bg-white transition-all duration-500 py-6 uppercase text-[10px] tracking-[0.4em] font-bold mt-4"
                            disabled={isCheckingOut}
                            onClick={handleCheckout}
                        >
                            {isCheckingOut ? "Processing..." : "Secure Checkout"}
                        </Button>
                        <p className="text-[9px] text-center text-white/30 uppercase tracking-widest">Complimentary returns on all orders</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
