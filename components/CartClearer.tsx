'use client'

import { useEffect } from 'react'
import { useCart } from '@/context/CartContext'

/** Clears the cart client-side after a successful Stripe payment. */
export function CartClearer() {
    const { clearCart } = useCart()
    useEffect(() => {
        clearCart()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}
