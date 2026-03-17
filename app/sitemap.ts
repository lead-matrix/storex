import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient()

    const baseUrl = 'https://dinacosmetic.store'

    // Fetch all active products
    const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('status', 'active')

    // Fetch all categories
    const { data: categories } = await supabase
        .from('categories')
        .select('slug')

    const sitemap: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: \`\${baseUrl}/shop\`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: \`\${baseUrl}/collections\`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: \`\${baseUrl}/about\`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: \`\${baseUrl}/contact\`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    // Add product routes
    if (products) {
        products.forEach((product) => {
            sitemap.push({
                url: \`\${baseUrl}/product/\${product.slug}\`,
                lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            })
        })
    }

    // Add category routes
    if (categories) {
        categories.forEach((category) => {
            sitemap.push({
                url: \`\${baseUrl}/collections/\${category.slug}\`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.6,
            })
        })
    }

    return sitemap
}
