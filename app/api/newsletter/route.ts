import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Insert into Supabase
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert([{ email }]);

        if (error) {
            // Handle unique constraint violation (already subscribed)
            if (error.code === '23505') {
                return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
            }
            throw error;
        }

        // 2. Optional: Send welcome email via Resend if environment variable is present
        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);

                await resend.emails.send({
                    from: 'DINA COSMETIC <newsletter@dinacosmetic.store>',
                    to: email,
                    subject: 'Welcome to The Obsidian Palace',
                    html: `
                        <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee;">
                            <h1 style="text-align: center; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.2em;">The Vault is Open</h1>
                            <p>Welcome to The Obsidian Palace. You are now part of our inner circle.</p>
                            <p>You will be the first to know about new collection launches, private events, and our latest editorial content.</p>
                            <div style="margin-top: 40px; border-top: 1px solid #D4AF37; padding-top: 20px; text-align: center; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.1em;">
                                DINA COSMETIC &copy; ${new Date().getFullYear()}
                            </div>
                        </div>
                    `
                });
            } catch (resendError) {
                console.error('Failed to send welcome email:', resendError);
                // We don't fail the whole request if email fails
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Newsletter Error:', err);
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
}
