import { unstable_cache } from 'next/cache'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

/**
 * Cached layout data — shared by every storefront page load.
 * Revalidate every 5 minutes via TTL.
 *
 * IMPORTANT: Must use the admin (service-role) client here, NOT the server
 * client. The server client calls cookies() internally, which is forbidden
 * inside unstable_cache() and causes a prerender error at build time.
 * Layout data (nav menus, social links, logo) is public — no RLS needed.
 */
export const getLayoutData = unstable_cache(
    async () => {
        const supabase = await createAdminClient()

        const [headerRes, shopLinksRes, legalLinksRes, socialRes, storeInfoRes] =
            await Promise.allSettled([
                supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'header_main').maybeSingle(),
                supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_shop').maybeSingle(),
                supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_legal').maybeSingle(),
                supabase.from('frontend_content').select('content_data').eq('content_key', 'site_social_links').maybeSingle(),
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
                socialRes.status === 'fulfilled' ? socialRes.value.data?.content_data ?? null : null,
            logoUrl:
                storeInfoRes.status === 'fulfilled'
                    ? (storeInfoRes.value.data?.setting_value as any)?.logo_url ?? null
                    : null,
        }
    },
    ['layout-data'],
    { revalidate: 300 }
)
