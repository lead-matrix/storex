import * as React from 'react';

interface DeliveryNotificationProps {
    orderId: string;
    trackingUrl: string;
    customerName?: string;
}

export const DeliveryNotificationEmail: React.FC<Readonly<DeliveryNotificationProps>> = ({
    orderId,
    trackingUrl,
    customerName,
}) => (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px', backgroundColor: '#fafaf9', color: '#1a1a1a' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #D4AF37', paddingBottom: '24px', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                Dina Cosmetic
            </h1>
            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#888', margin: 0 }}>
                Your Order Has Been Delivered
            </p>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'normal', margin: '0 0 8px 0' }}>
                Your order has arrived{customerName ? `, ${customerName}` : ''}!
            </h2>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
                We hope you love your Dina Cosmetic products. If you have any questions or concerns about your order, please don&apos;t hesitate to reach out.
            </p>
        </div>

        {/* Order Info */}
        {orderId && (
            <div style={{ backgroundColor: '#f5f0e8', border: '1px solid #D4AF37', padding: '16px 20px', marginBottom: '28px', borderRadius: '4px' }}>
                <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', margin: '0 0 4px 0' }}>Order Number</p>
                <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a', margin: 0, fontWeight: 'bold' }}>
                    #{orderId.slice(0, 8).toUpperCase()}
                </p>
            </div>
        )}

        {/* Track Link */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <a
                href={trackingUrl}
                style={{
                    display: 'inline-block',
                    backgroundColor: '#1a1a1a',
                    color: '#D4AF37',
                    padding: '14px 32px',
                    fontSize: '11px',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    borderRadius: '2px',
                }}
            >
                View Delivery Details
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
