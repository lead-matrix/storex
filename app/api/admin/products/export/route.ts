import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Fetch products and their variants
        const { data: products, error } = await supabase
            .from("products")
            .select(`
                id,
                title,
                slug,
                description,
                base_price,
                sale_price,
                stock,
                status,
                images,
                category_id,
                weight_grams,
                length_cm,
                width_cm,
                height_cm,
                product_variants (
                    id,
                    name,
                    sku,
                    price_override,
                    stock,
                    variant_type,
                    color_code,
                    image_url,
                    weight
                )
            `);

        if (error) throw error;

        // 2. Flatten data for CSV
        const csvData: any[] = [];

        products?.forEach((product) => {
            const baseRow = {
                product_id: product.id,
                title: product.title,
                slug: product.slug,
                description: product.description,
                base_price: product.base_price,
                sale_price: product.sale_price,
                product_stock: product.stock,
                product_status: product.status,
                images: product.images?.join(', '),
                category_id: product.category_id,
                weight_oz: product.weight_grams,  // column stores oz
                length_in: product.length_cm,      // column stores inches
                width_in: product.width_cm,        // column stores inches
                height_in: product.height_cm,      // column stores inches
            };

            if (product.product_variants && product.product_variants.length > 0) {
                product.product_variants.forEach((variant: any) => {
                    csvData.push({
                        ...baseRow,
                        variant_id: variant.id,
                        variant_name: variant.name,
                        sku: variant.sku,
                        price_override: variant.price_override,
                        variant_stock: variant.stock,
                        variant_type: variant.variant_type,
                        color_code: variant.color_code,
                        variant_image: variant.image_url,
                        variant_weight: variant.weight,
                    });
                });
            } else {
                csvData.push({
                    ...baseRow,
                    variant_id: '',
                    variant_name: '',
                    sku: '',
                    price_override: '',
                    variant_stock: '',
                    variant_type: '',
                    color_code: '',
                    variant_image: '',
                    variant_weight: '',
                });
            }
        });

        // 3. Convert to CSV
        const csv = Papa.unparse(csvData);

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error: any) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
