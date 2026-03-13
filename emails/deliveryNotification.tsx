import * as React from 'react';

interface DeliveryNotificationProps {
    trackingUrl: string;
}

export const DeliveryNotificationEmail: React.FC<Readonly<DeliveryNotificationProps>> = ({
    trackingUrl,
}) => (
    <div>
        <h1>Artifacts Delivered</h1>
        <p>Your artifacts have successfully arrived.</p>
        <a href={trackingUrl}>View Delivery Details</a>
    </div>
);
