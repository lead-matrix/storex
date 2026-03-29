import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is an admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse and save the shipping configuration
        const config = await req.json();

        const { error } = await supabase
            .from('site_settings')
            .upsert(
                { 
                    setting_key: 'shipping_settings', 
                    setting_value: config 
                }, 
                { onConflict: 'setting_key' }
            );

        if (error) {
            console.error('[Shipping Config] DB Error:', error);
            return NextResponse.json({ error: 'Failed to update shipping configuration' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Shipping configuration saved' });
    } catch (err: any) {
        console.error('[Shipping Config] Unexpected Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
