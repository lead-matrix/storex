import { NextResponse } from 'next/server';
import { getProducts, searchProducts } from '@/services/productService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    const products = query
      ? await searchProducts(query)
      : await getProducts();

    return NextResponse.json(products);
  } catch (err: any) {
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
