"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateUserRole(userId: string, newRole: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        console.error("Failed to update user role:", error)
        throw new Error("Failed to update user role")
    }

    revalidatePath("/admin/users")
}
