import { requireAuth } from '@/route-guard'

export const dynamic = 'force-dynamic'

export default async function CheckoutLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // requireAuth → redirects to /login if no authenticated session
    await requireAuth('/login?next=/checkout')

    return <>{children}</>
}
