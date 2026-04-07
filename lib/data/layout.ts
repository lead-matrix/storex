import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Cached layout data — shared by every storefront page load.
 * Revalidate every 5 minutes. Call `revalidateTag('layout')` from
 * any admin action that changes navigation menus, social links, or the logo.
 */
export const getLayoutData = unstable_cache(
    async () => {
        const supabase = await createClient()

        const [headerRes, shopLinksRes, legalLinksRes, socialRes, storeInfoRes] =
            await Promise.allSettled([
                supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'header_main').maybeSingle(),
                supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_shop').maybeSingle(),
                supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_legal').maybeSingle(),
                supabase.from('site_settings').select('setting_value').eq('setting_key', 'social_media').maybeSingle(),
                supabase.from('site_settings').select('setting_value').eq('setting_key', 'store_info').maybeSingle(),
            ])

        return {
            headerNavItems:
                headerRes.status === 'fulfilled' ? headerRes.value.data?.menu_items ?? [] : [],
            footerShopItems:
                shopLinksRes.status === 'fulfilled' ? shopLinksRes.value.data?.menu_items ?? [] : [],
            footerLegalItems:
                legalLinksRes.status === 'fulfilled' ? legalLinksRes.value.data?.menu_items ?? [] : [],
            socialLinks:
                socialRes.status === 'fulfilled' ? socialRes.value.data?.setting_value ?? null : null,
            logoUrl:
                storeInfoRes.status === 'fulfilled'
                    ? (storeInfoRes.value.data?.setting_value as any)?.logo_url ?? null
                    : null,
        }
    },
    ['layout-data'],
    { revalidate: 300, tags: ['layout'] }
)
