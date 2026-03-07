import { requireAdmin } from '@/lib/auth'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // requireAdmin → redirects to /login if unauthenticated, redirects to / if not admin
    await requireAdmin()

    return <AdminLayoutClient>{children}</AdminLayoutClient>
}
