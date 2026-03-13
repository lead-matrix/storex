import * as React from 'react';

interface OrderConfirmationProps {
    orderId: string;
    items: any[];
    total: number;
}

export const OrderConfirmationEmail: React.FC<Readonly<OrderConfirmationProps>> = ({
    orderId,
    items,
    total,
}) => (
    <div>
        <h1>Your Dina Cosmetic Masterpiece is Confirmed</h1>
        <p>Registry #{orderId}</p>
        <ul>
            {items.map((item, i) => (
                <li key={i}>{item.name} x {item.quantity} - ${item.price}</li>
            ))}
        </ul>
        <p>Total: ${total}</p>
    </div>
);
