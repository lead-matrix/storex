"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadProductImage(file: File) {
    const supabase = await createClient();

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        console.error("Upload failed:", error.message);
        throw new Error("Image upload failed");
    }

    return data.path;
}

export async function createProduct(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const base_price = Number(formData.get("base_price"));
    const stock = Number(formData.get("stock"));
    const description = (formData.get("description") as string) || "";
    const category_id = formData.get("category_id") as string;
    const is_featured = formData.get("is_featured") === "true";

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { error } = await supabase.from("products").insert({
        name,
        slug,
        base_price,
        stock,
        description,
        category_id: category_id || null,
        is_featured,
        is_active: true,
        images: [] // Initially empty, can be updated later
    });

    if (error) {
        console.error("Create product failed:", error);
        throw new Error(error.message);
    }
    revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/products");
}
