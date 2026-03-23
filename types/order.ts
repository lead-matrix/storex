export interface OrderItem {
    id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
    variantName?: string;
}

export interface OrderRecord {
    id: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string | null;
    amount_total: number;
    currency: string;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'failed';
    fulfillment_status: 'unfulfilled' | 'shipped' | 'delivered' | 'returned' | 'failed' | 'out_for_delivery';
    shipping_address: any;
    billing_address: any;
    stripe_session_id: string | null;
    tracking_number: string | null;
    last_tracking_update: string | null;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
    total_amount?: number; // Some legacy code uses total_amount
}
