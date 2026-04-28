"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
    id: string; // variant id or product id if no variants
    productId: string;
    variantId?: string; // explicit variant id for order_items / stock deduction
    name: string;
    price: number;
    image: string;
    quantity: number;
    variantName?: string;
    variantWeight?: number | null;
    productWeight?: number | null;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    /** true once localStorage has been read — use to suppress hydration flicker */
    isMounted: boolean;
    /** Sync cart items to database for abandoned cart recovery */
    syncAbandonedCart: (email: string) => Promise<void>;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Load cart from localStorage on mount — runs AFTER hydration to avoid SSR/CSR mismatch
    useEffect(() => {
        const savedCart = localStorage.getItem("lmt-cart");
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
        setIsMounted(true);
    }, []);

    // Persist cart to localStorage whenever it changes (only after initial mount)
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("lmt-cart", JSON.stringify(cart));
        }
    }, [cart, isMounted]);

    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
                );
            }
            return [...prev, item];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((i) => i.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setCart((prev) =>
            prev.map((i) => (i.id === id ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => setCart([]);

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                subtotal,
                isCartOpen,
                setIsCartOpen,
                isMounted,
                syncAbandonedCart: async (email: string) => {
                    if (!email || !email.includes("@")) return;
                    try {
                        const { createClient } = await import("@/lib/supabase/client");
                        const supabase = createClient();
                        await supabase.rpc("upsert_abandoned_cart", {
                            p_email: email,
                            p_cart_data: cart,
                        });
                    } catch (e) {
                        console.error("Failed to sync abandoned cart", e);
                    }
                },
            }}

        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
