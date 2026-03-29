// ── Shared Order Types ────────────────────────────────────────────────────────
// Single source of truth for all order-related shapes across the application.

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type FulfillmentStatus =
  | 'unfulfilled'
  | 'partial'
  | 'fulfilled'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'failed';

export interface OrderAddress {
  name?: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  fulfilled_quantity?: number;
  name?: string;
  image?: string;
  variantName?: string;
  created_at?: string;
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

/** Primary order record — aligns with the `orders` DB table */
export interface OrderRecord {
  id: string;
  user_id?: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  amount_total: number;
  currency: string;
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  shipping_address: OrderAddress | any;
  billing_address: OrderAddress | any;
  stripe_session_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  shippo_tracking_status: string | null;
  shipping_label_url?: string | null;
  coupon_id?: string | null;
  last_tracking_update?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  /** @deprecated use amount_total */
  total_amount?: number;
}
