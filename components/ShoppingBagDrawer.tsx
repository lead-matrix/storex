"use client";

import { useCart } from "@/context/CartContext";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function ShoppingBagDrawer() {
    const { cart, subtotal, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    if (pathname?.startsWith('/admin')) return null;

    const FREE_SHIPPING_THRESHOLD = 100;
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
            <SheetContent className="bg-black border-l border-luxury-border w-full sm:max-w-md p-0 flex flex-col text-white">
                <SheetHeader className="p-8 border-b border-border">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-3 text-textPrimary font-playfair tracking-wide text-xl">
                            <ShoppingBag className="w-5 h-5 text-primary" strokeWidth={1.5} />
                            YOUR BAG
                        </SheetTitle>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest mb-3 text-luxury-subtext">
                            <span>{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping.toFixed(2)} for free shipping` : "Free shipping earned"}</span>
                            <span>{freeShippingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-[2px] bg-white/5 w-full overflow-hidden">
                            <div
                                className="h-full bg-gold transition-all duration-1000 ease-out"
                                style={{ width: `${freeShippingProgress}%` }}
                            />
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-grow overflow-y-auto min-h-0 block-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-24 text-center px-8">
                            <ShoppingBag className="w-12 h-12 text-textSecondary mb-6" strokeWidth={1} />
                            <p className="text-textSecondary uppercase tracking-widest text-xs">Your bag is currently empty</p>
                            <button
                                className="mt-8 border border-primary px-6 py-3 text-primary tracking-widest uppercase hover:bg-primary hover:text-black transition"
                                onClick={() => setIsCartOpen(false)}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 space-y-8">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="relative w-24 aspect-[4/5] bg-surface border border-border flex-shrink-0">
                                        <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                                    </div>
                                    <div className="flex-grow flex flex-col pt-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-playfair text-sm text-textPrimary tracking-wide uppercase leading-tight group-hover:text-primary transition-colors">{item.name}</h4>
                                            <button onClick={() => removeFromCart(item.id)} className="text-textSecondary hover:text-textPrimary transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>

                                        <p className="text-gold text-xs mt-2 font-medium">${item.price.toFixed(2)}</p>

                                        <div className="flex items-center justify-between mt-auto pb-1">
                                            <div className="flex items-center gap-4 text-white/60">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="hover:text-primary transition-colors">
                                                    <Minus size={12} />
                                                </button>
                                                <span className="text-[10px] uppercase tracking-widest font-medium w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="hover:text-primary transition-colors">
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-8 bg-background border-t border-border space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-textSecondary">
                                <span>Subtotal</span>
                                <span className="text-textPrimary font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-textSecondary">
                                <span>Shipping</span>
                                <span className="text-textPrimary font-medium">{subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "$10.00"}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-4 border-t border-border">
                            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-textPrimary">Total</span>
                            <span className="text-primary text-2xl font-playfair">
                                ${(subtotal >= FREE_SHIPPING_THRESHOLD ? subtotal : subtotal + 10).toFixed(2)}
                            </span>
                        </div>

                        <button
                            className="bg-primary text-black w-full py-5 flex items-center justify-center gap-3 disabled:opacity-50 tracking-widest uppercase font-semibold hover:opacity-90 transition rounded-none"
                            disabled={isCheckingOut}
                            onClick={handleCheckout}
                        >
                            {isCheckingOut ? "Initializing..." : "Checkout Order"}
                        </button>
                        <p className="text-[9px] text-center text-textSecondary uppercase tracking-widest pb-2 opacity-50">Secure SSL Encrypted Checkout</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
