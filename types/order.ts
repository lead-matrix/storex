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

export interface TrackingUpdate {
    id: string;
    order_id: string;
    status: string;
    details: string | null;
    location: string | null;
    shippo_event_id: string | null;
    object_created: string;
    created_at: string;
}

export interface ShippoTrackingHistoryItem {
    object_created: string;
    object_id: string;
    status: string;
    status_details: string;
    status_date: string;
    location: {
        city: string;
        state: string;
        zip: string;
        country: string;
    } | null;
}

export interface ShippoTracking {
    carrier: string;
    tracking_number: string;
    tracking_status: ShippoTrackingHistoryItem | null;
    tracking_history: ShippoTrackingHistoryItem[];
}

export interface OrderRecord {
    id: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string | null;
    amount_total: number;
    currency: string;
    status: 'pending' | 'paid' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
    fulfillment_status: 'unfulfilled' | 'shipped' | 'delivered' | 'returned' | 'failed' | 'out_for_delivery';
    shipping_address: any;
    billing_address: any;
    stripe_session_id: string | null;
    tracking_number: string | null;
    carrier: string | null;
    shippo_tracking_status: string | null;
    last_tracking_update: string | null;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
    total_amount?: number; // Some legacy code uses total_amount
}
