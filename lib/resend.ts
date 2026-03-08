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
