import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = "DINA COSMETIC <orders@updates.dinacosmetic.com>";

export async function sendOrderConfirmation(email: string, orderId: string, items: any[], total: number) {
    if (!process.env.RESEND_API_KEY) {
        // console.info("No Resend API Key. Skipping email.");
        return;
    }

    const itemsHtml = items.map((item) => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                <strong>${item.name || "Product"}</strong> x ${item.quantity}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                $${(item.price * item.quantity).toFixed(2)}
            </td>
        </tr>
    `).join("");

    const html = `
        <div style="font-family: 'Times New Roman', Times, serif; color: #111; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 40px 0;">
                <h1 style="letter-spacing: 4px; text-transform: uppercase; font-size: 24px; margin: 0;">DINA COSMETIC</h1>
                <p style="letter-spacing: 2px; text-transform: uppercase; font-size: 10px; color: #666; margin-top: 10px;">The Obsidian Palace</p>
            </div>
            <div style="padding: 20px;">
                <h2 style="font-style: italic; font-size: 20px; font-weight: normal; margin-bottom: 30px;">Masterpiece Confirmed</h2>
                <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #444;">
                    Your request has been received. Our artisans are strictly preparing your artifacts from the Vault.
                </p>
                <div style="margin: 40px 0; padding: 20px; border: 1px solid #eee; background-color: #fafafa;">
                    <p style="font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Registry #${orderId.slice(0, 8).toUpperCase()}</p>
                    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
                        ${itemsHtml}
                    </table>
                    <div style="text-align: right; padding-top: 20px; font-family: sans-serif;">
                        <strong>Total: $${total.toFixed(2)}</strong>
                    </div>
                </div>
                <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #444;">
                    You will receive an encrypted transmission with your shipping manifest once the artifacts are dispatched.
                </p>
                <p style="font-family: sans-serif; font-size: 14px; color: #888; margin-top: 40px;">
                    Absolute Excellence,<br>
                    Dina Cosmetic
                </p>
            </div>
        </div>
    `;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Your Dina Cosmetic Masterpiece is Confirmed",
            html: html,
        });
        // console.info("Order confirmation email sent to:", email);
    } catch (err) {
        console.error("Failed to send order confirmation email:", err);
    }
}

export async function sendShippingNotification(email: string, orderId: string, trackingUrl: string) {
    if (!process.env.RESEND_API_KEY) {
        // console.info("No Resend API Key. Skipping email.");
        return;
    }

    const html = `
        <div style="font-family: 'Times New Roman', Times, serif; color: #111; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 40px 0;">
                <h1 style="letter-spacing: 4px; text-transform: uppercase; font-size: 24px; margin: 0;">DINA COSMETIC</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="font-style: italic; font-size: 20px; font-weight: normal; margin-bottom: 30px;">Artifacts Dispatched</h2>
                <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #444;">
                    Your artifacts have departed the Obsidian Palace and are en route to your sanctuary.
                </p>
                <div style="margin: 40px 0; text-align: center;">
                    <a href="${trackingUrl}" style="background-color: #111; color: #fff; padding: 14px 30px; text-decoration: none; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                        Track Shipment
                    </a>
                </div>
            </div>
        </div>
    `;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Your Dina Cosmetic Artifacts Have Shipped",
            html: html,
        });
        // console.info("Shipping notification email sent to:", email);
    } catch (err) {
        console.error("Failed to send shipping notification email:", err);
    }
}

export async function sendDeliveryNotification(email: string, orderId: string, trackingUrl: string) {
    if (!process.env.RESEND_API_KEY) {
        return;
    }

    const html = `
        <div style="font-family: 'Times New Roman', Times, serif; color: #111; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 40px 0;">
                <h1 style="letter-spacing: 4px; text-transform: uppercase; font-size: 24px; margin: 0;">DINA COSMETIC</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="font-style: italic; font-size: 20px; font-weight: normal; margin-bottom: 30px;">Artifacts Delivered</h2>
                <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #444;">
                    Your artifacts have successfully arrived at your sanctuary. We trust they meet your absolute standard.
                </p>
                <div style="margin: 40px 0; text-align: center;">
                    <a href="${trackingUrl}" style="background-color: #111; color: #fff; padding: 14px 30px; text-decoration: none; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                        View Delivery Details
                    </a>
                </div>
            </div>
        </div>
    `;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Your Dina Cosmetic Artifacts Have Been Delivered",
            html: html,
        });
    } catch (err) {
        console.error("Failed to send delivery notification email:", err);
    }
}

export async function sendAbandonedCartRecovery(email: string, items: any[], total: number, recoveryLink: string) {
    if (!process.env.RESEND_API_KEY) return;

    const itemsHtml = items.map((item) => `
        <div style="margin-bottom: 10px; font-size: 14px; font-family: sans-serif;">
            <strong>${item.name || item.title || "Elite Artifact"}</strong> x ${item.quantity}
        </div>
    `).join("");

    const html = `
        <div style="font-family: 'Times New Roman', Times, serif; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #111;">
            <div style="text-align: center; padding: 60px 40px; background-color: #111; color: #fff;">
                <h1 style="letter-spacing: 6px; text-transform: uppercase; font-size: 28px; margin: 0;">DINA COSMETIC</h1>
                <p style="letter-spacing: 3px; text-transform: uppercase; font-size: 10px; color: #d4af37; margin-top: 15px; font-weight: bold;">Unfinished Masterpiece</p>
            </div>
            <div style="padding: 40px;">
                <h2 style="font-style: italic; font-size: 24px; font-weight: normal; margin-bottom: 25px; color: #111;">Return to the Vault</h2>
                <p style="font-family: sans-serif; font-size: 15px; line-height: 1.8; color: #444; margin-bottom: 30px;">
                    We noticed you left several curated artifacts behind. The Obsidian Palace remains open for you to finalize your selection before these assets are reclaimed by the collection.
                </p>
                
                <div style="padding: 30px; border: 1px solid #eee; background-color: #fcfcfc; margin-bottom: 40px;">
                    <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 10px; font-weight: bold; margin-bottom: 20px; color: #888;">Reserved Items</p>
                    ${itemsHtml}
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: right;">
                        <span style="font-family: sans-serif; font-size: 16px; font-weight: bold;">Valuation: $${total.toFixed(2)}</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="${recoveryLink}" style="background-color: #111; color: #fff; padding: 18px 40px; text-decoration: none; font-family: sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 3px; display: inline-block; font-weight: bold;">
                        Complete Your Order
                    </a>
                </div>

                <p style="font-family: sans-serif; font-size: 13px; color: #999; margin-top: 50px; text-align: center; font-style: italic;">
                    Rare artifacts wait for no one. Secure your artifacts today.
                </p>
            </div>
        </div>
    `;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Your Dina Cosmetic Masterpiece Awaits",
            html: html,
        });
    } catch (err) {
        console.error("Failed to send recovery email:", err);
    }
}
