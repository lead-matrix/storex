import * as React from 'react';

interface ShippingConfirmationProps {
    trackingUrl: string;
}

export const ShippingConfirmationEmail: React.FC<Readonly<ShippingConfirmationProps>> = ({
    trackingUrl,
}) => (
    <div>
        <h1>Artifacts Dispatched</h1>
        <p>Your artifacts have departed and are en route.</p>
        <a href={trackingUrl}>Track Shipment</a>
    </div>
);
