import { requireAuth } from '@/route-guard'

export const dynamic = 'force-dynamic'

export default async function CheckoutLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // No auth guard here — Guest checkout is fully enabled.
    // Auth is handled optionally in the API to link users if they are logged in.

    return <>{children}</>
}
