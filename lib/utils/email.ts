import { Resend } from 'resend';

const getResend = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        // During build time, return a mock or throw a helpful error only when called
        return new Resend('re_123'); // Placeholder for build phase
    }
    return new Resend(apiKey);
};

const resend = getResend();

interface OrderEmailProps {
    orderId: string;
    customerEmail: string;
    customerName: string;
    totalAmount: number;
    trackingNumber?: string;
    labelUrl?: string;
}

export async function sendOrderConfirmationEmail({
    orderId,
    customerEmail,
    customerName,
    totalAmount
}: OrderEmailProps) {
    try {
        await resend.emails.send({
            from: 'DINA COSMETIC <concierge@dinacosmetic.store>',
            to: customerEmail,
            subject: 'Your Ritual Has Begun - Order Confirmation',
            html: `
                <div style="background-color: #000; color: #fff; font-family: 'serif'; padding: 40px; border: 1px solid #D4AF37;">
                    <h1 style="color: #D4AF37; letter-spacing: 5px; text-align: center;">DINA COSMETIC</h1>
                    <div style="border-top: 1px solid #333; margin: 20px 0;"></div>
                    <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 12px; color: #888;">Order Confirmation</p>
                    <h2 style="font-weight: normal;">Salutations, ${customerName}</h2>
                    <p style="line-height: 1.6; color: #ccc;">Your selection has been registered at The Obsidian Palace. Our artisans are now preparing your artifacts for manifestation.</p>
                    
                    <div style="background-color: #111; padding: 20px; margin: 30px 0;">
                        <p style="margin: 0; font-size: 10px; color: #D4AF37; text-transform: uppercase;">Reference ID</p>
                        <p style="margin: 5px 0 0 0; font-family: monospace;">${orderId}</p>
                        <br/>
                        <p style="margin: 0; font-size: 10px; color: #D4AF37; text-transform: uppercase;">Total Investment</p>
                        <p style="margin: 5px 0 0 0;">$${totalAmount.toFixed(2)}</p>
                    </div>

                    <p style="font-size: 11px; color: #555; text-align: center; margin-top: 40px;">
                        This is an automated manifestation from The Obsidian Palace.
                    </p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
    }
}

export async function sendShippingNotificationEmail({
    customerEmail,
    customerName,
    trackingNumber,
    labelUrl
}: OrderEmailProps) {
    try {
        await resend.emails.send({
            from: 'DINA COSMETIC <concierge@dinacosmetic.store>',
            to: customerEmail,
            subject: 'Artifacts Manifested - Your Order is En Route',
            html: `
                <div style="background-color: #000; color: #fff; font-family: 'serif'; padding: 40px; border: 1px solid #D4AF37;">
                    <h1 style="color: #D4AF37; letter-spacing: 5px; text-align: center;">DINA COSMETIC</h1>
                    <div style="border-top: 1px solid #333; margin: 20px 0;"></div>
                    <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 12px; color: #888;">Shipping Manifest</p>
                    <h2 style="font-weight: normal;">Your Artifacts are En Route, ${customerName}</h2>
                    <p style="line-height: 1.6; color: #ccc;">Your selection has completed its preparation and has been dispatched from The Obsidian Palace.</p>
                    
                    <div style="background-color: #111; padding: 20px; margin: 30px 0; border: 1px solid #D4AF3733;">
                        <p style="margin: 0; font-size: 10px; color: #D4AF37; text-transform: uppercase;">Tracking Number</p>
                        <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px;">${trackingNumber}</p>
                    </div>

                    <p style="line-height: 1.6; color: #ccc;">You can monitor the manifestation progress through your local courier service.</p>

                    <p style="font-size: 11px; color: #555; text-align: center; margin-top: 40px;">
                        The ritual continues.
                    </p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send shipping email:', error);
    }
}
