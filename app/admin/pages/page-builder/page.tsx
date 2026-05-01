import { redirect } from "next/navigation"

// Old primitive page builder — replaced by /admin/builder (13 blocks, drag-and-drop)
export default function OldPageBuilderRedirect() {
    redirect("/admin/builder")
}
