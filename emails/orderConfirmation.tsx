import * as React from 'react';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface OrderConfirmationProps {
    orderId: string;
    items: OrderItem[];
    total: number;
    customerName?: string;
    shippingAddress?: string;
}

export const OrderConfirmationEmail: React.FC<Readonly<OrderConfirmationProps>> = ({
    orderId,
    items,
    total,
    customerName,
    shippingAddress,
}) => (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px', backgroundColor: '#fafaf9', color: '#1a1a1a' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #D4AF37', paddingBottom: '24px', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                Dina Cosmetic
            </h1>
            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#888', margin: 0 }}>
                Order Confirmed
            </p>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'normal', margin: '0 0 8px 0' }}>
                Thank you{customerName ? `, ${customerName}` : ''}!
            </h2>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
                Your order has been received and is being processed. We&apos;ll notify you once it ships.
            </p>
        </div>

        {/* Order Number */}
        <div style={{ backgroundColor: '#f5f0e8', border: '1px solid #D4AF37', padding: '16px 20px', marginBottom: '28px', borderRadius: '4px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', margin: '0 0 4px 0' }}>Order Number</p>
            <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a', margin: 0, fontWeight: 'bold' }}>
                #{orderId.slice(0, 8).toUpperCase()}
            </p>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '12px' }}>Order Summary</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e8e4dc' }}>
                            <td style={{ padding: '10px 0', fontSize: '14px', color: '#333' }}>
                                {item.name}
                            </td>
                            <td style={{ padding: '10px 0', fontSize: '13px', color: '#666', textAlign: 'center' }}>
                                × {item.quantity}
                            </td>
                            <td style={{ padding: '10px 0', fontSize: '14px', color: '#1a1a1a', textAlign: 'right', fontWeight: 'bold' }}>
                                ${(item.price * item.quantity).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={2} style={{ padding: '16px 0 4px', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888' }}>
                            Total
                        </td>
                        <td style={{ padding: '16px 0 4px', fontSize: '18px', color: '#D4AF37', textAlign: 'right', fontWeight: 'bold' }}>
                            ${total.toFixed(2)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>

        {/* Shipping Address */}
        {shippingAddress && (
            <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>Shipping To</p>
                <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', margin: 0 }}>{shippingAddress}</p>
            </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e8e4dc', paddingTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#999', lineHeight: '1.6', margin: '0 0 8px 0' }}>
                Questions? Contact us at <a href="mailto:dinaecosmetic@gmail.com" style={{ color: '#D4AF37' }}>dinaecosmetic@gmail.com</a>
            </p>
            <p style={{ fontSize: '11px', color: '#bbb', margin: 0, letterSpacing: '1px' }}>
                © {new Date().getFullYear()} Dina Cosmetic. All rights reserved.
            </p>
        </div>
    </div>
);
