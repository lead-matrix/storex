import { Shippo } from 'shippo';

export const shippo = new Shippo({
    apiKeyHeader: `shippo_test_${process.env.SHIPPO_API_KEY}`.replace('shippo_test_shippo_test_', 'shippo_test_')
});

// Assuming user might just put the token or full "shippo_test_" prefix in .env
