import { Shippo } from 'shippo';

const rawKey = process.env.SHIPPO_API_KEY || ''

let processedKey = rawKey

if (!rawKey.startsWith('shippo_test_') && !rawKey.startsWith('shippo_live_')) {
    // Key has no prefix — we cannot safely guess test vs live
    // Log a loud warning so this is never silently wrong in production
    console.warn(
        '[Shippo] ⚠️  SHIPPO_API_KEY has no prefix (expected shippo_test_... or shippo_live_...).' +
        ' Assuming TEST mode. If this is production, prepend shippo_live_ to your key in Vercel env vars.'
    )
    processedKey = `shippo_test_${rawKey}`
}

export const shippo = new Shippo({
    apiKeyHeader: `ShippoToken ${processedKey}`
})
