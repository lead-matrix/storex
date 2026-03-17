import * as React from 'react';

interface ShippingConfirmationProps {
    orderId: string;
    trackingUrl: string;
    trackingNumber?: string;
    customerName?: string;
    estimatedDelivery?: string;
}

export const ShippingConfirmationEmail: React.FC<Readonly<ShippingConfirmationProps>> = ({
    orderId,
    trackingUrl,
    trackingNumber,
    customerName,
    estimatedDelivery,
}) => (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px', backgroundColor: '#fafaf9', color: '#1a1a1a' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #D4AF37', paddingBottom: '24px', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                Dina Cosmetic
            </h1>
            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#888', margin: 0 }}>
                Your Order Has Shipped
            </p>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'normal', margin: '0 0 8px 0' }}>
                Great news{customerName ? `, ${customerName}` : ''}!
            </h2>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
                Your order is on its way. Use the tracking link below to follow your shipment.
            </p>
        </div>

        {/* Order + Tracking Info */}
        <div style={{ backgroundColor: '#f5f0e8', border: '1px solid #D4AF37', padding: '20px 24px', marginBottom: '28px', borderRadius: '4px' }}>
            {orderId && (
                <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', margin: '0 0 4px 0' }}>Order Number</p>
                    <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a', margin: 0, fontWeight: 'bold' }}>
                        #{orderId.slice(0, 8).toUpperCase()}
                    </p>
                </div>
            )}
            {trackingNumber && (
                <div>
                    <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', margin: '0 0 4px 0' }}>Tracking Number</p>
                    <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a', margin: 0, fontWeight: 'bold' }}>
                        {trackingNumber}
                    </p>
                </div>
            )}
            {estimatedDelivery && (
                <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', margin: '0 0 4px 0' }}>Estimated Delivery</p>
                    <p style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{estimatedDelivery}</p>
                </div>
            )}
        </div>

        {/* Track Button */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <a
                href={trackingUrl}
                style={{
                    display: 'inline-block',
                    backgroundColor: '#D4AF37',
                    color: '#000',
                    padding: '14px 32px',
                    fontSize: '11px',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    borderRadius: '2px',
                }}
            >
                Track My Order
            </a>
        </div>

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
