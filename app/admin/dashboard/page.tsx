import { redirect } from 'next/navigation'

// /admin/dashboard → redirect to the real admin overview at /admin
export default function AdminDashboardPage() {
    redirect('/admin')
}