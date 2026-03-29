import { NextResponse } from 'next/server';
import { getProductById } from '@/services/productService';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Group active variants by type for the storefront
    const variantsByType = (product.variants ?? [])
      .filter((v: any) => v.status === 'active')
      .reduce((acc: any, v: any) => {
        const type = v.variant_type || 'option';
        if (!acc[type]) acc[type] = [];
        const basePrice = v.price_override ?? product.base_price;
        acc[type].push({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: basePrice,
          sale_price: product.on_sale ? product.sale_price : null,
          final_price: product.on_sale && product.sale_price != null ? product.sale_price : basePrice,
          stock: v.stock,
          color_code: v.color_code,
          image_url: v.image_url || product.images?.[0] || '',
        });
        return acc;
      }, {});

    return NextResponse.json({
      ...product,
      name: product.title,
      image_url: product.images?.[0] ?? '',
      is_active: product.status === 'active',
      variants: variantsByType,
    });
  } catch (err: any) {
    console.error('[GET /api/products/[id]]', err);
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
}
