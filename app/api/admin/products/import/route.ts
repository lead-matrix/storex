import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Papa from "papaparse";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        let rows: any[] = [];
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (fileExt === 'csv') {
            const csvString = await file.text();
            const { data, errors } = Papa.parse(csvString, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
            });
            if (errors.length > 0) {
                console.error("CSV Parse Errors:", errors);
                return NextResponse.json({ error: "Invalid CSV format", details: errors }, { status: 400 });
            }
            rows = data;
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
            const buffer = await file.arrayBuffer();
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rows = xlsx.utils.sheet_to_json(worksheet);
        } else {
            return NextResponse.json({ error: "Unsupported file format. Please upload .csv or .xlsx" }, { status: 400 });
        }

        // Group rows by product (slug or product_id)
        const productsMap: Record<string, any> = {};

        rows.forEach((row: any) => {
            const productKey = row.product_id || row.slug || row.title;
            if (!productKey) return;

            if (!productsMap[productKey]) {
                productsMap[productKey] = {
                    id: row.product_id || undefined,
                    title: row.title,
                    slug: row.slug || row.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    description: row.description || '',
                    base_price: parseFloat(row.base_price) || 0,
                    sale_price: row.sale_price ? parseFloat(row.sale_price) : null,
                    stock: parseInt(row.product_stock) || 0,
                    status: row.product_status || 'active',
                    images: row.images ? row.images.split(',').map((img: string) => img.trim()).filter(Boolean) : [],
                    category_id: row.category_id || null,
                    // weight_grams column stores oz (updated unit system)
                    weight_grams: parseFloat(row.weight_oz || row.weight_grams) || null,
                    length_cm: parseFloat(row.length_in || row.length_cm) || null,
                    width_cm: parseFloat(row.width_in || row.width_cm) || null,
                    height_cm: parseFloat(row.height_in || row.height_cm) || null,
                    variants: []
                };
            }

            if (row.sku || row.variant_name || row.variant_id) {
                productsMap[productKey].variants.push({
                    id: row.variant_id || undefined,
                    name: row.variant_name,
                    sku: row.sku,
                    price_override: row.price_override ? parseFloat(row.price_override) : null,
                    stock: parseInt(row.variant_stock) || 0,
                    variant_type: row.variant_type || 'shade',
                    color_code: row.color_code || null,
                    image_url: row.variant_image || null,
                    weight: row.variant_weight ? parseFloat(row.variant_weight) : null,
                });
            }
        });

        // Upsert Products and Variants
        const results = [];
        for (const key in productsMap) {
            const p = productsMap[key];
            const productData = { ...p };
            delete productData.variants;

            let productId = p.id;

            // 1. Upsert Product
            const { data: upsertedProduct, error: pError } = await supabase
                .from('products')
                .upsert(productData, { onConflict: 'slug' })
                .select()
                .single();

            if (pError) {
                console.error(`Error upserting product ${p.title}:`, pError);
                continue;
            }

            productId = upsertedProduct.id;

            // 2. Upsert Variants
            if (p.variants.length > 0) {
                const variantsToUpsert = p.variants.map((v: any) => ({
                    ...v,
                    product_id: productId
                }));

                const { error: vError } = await supabase
                    .from('product_variants')
                    .upsert(variantsToUpsert, { onConflict: 'sku' });

                if (vError) {
                    console.error(`Error upserting variants for ${p.title}:`, vError);
                }
            }
            results.push(p.title);
        }

        return NextResponse.json({ success: true, processed: results.length, products: results });
    } catch (error: any) {
        console.error("Import Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
