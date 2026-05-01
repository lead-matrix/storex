import { redirect } from "next/navigation"

// /admin/pages → redirect to the real Page Builder
export default function AdminPagesRedirect() {
    redirect("/admin/builder")
}
