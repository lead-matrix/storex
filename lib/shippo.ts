import { Shippo } from 'shippo';

const rawKey = process.env.SHIPPO_API_KEY || '';
const processedKey = (rawKey.startsWith('shippo_test_') || rawKey.startsWith('shippo_live_'))
    ? rawKey
    : `shippo_test_${rawKey}`;

export const shippo = new Shippo({
    apiKeyHeader: `ShippoToken ${processedKey}`
});

// Assuming user might just put the token or full "shippo_test_" prefix in .env
