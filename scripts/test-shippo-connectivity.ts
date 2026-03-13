import { Shippo } from 'shippo';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.SHIPPO_API_KEY;

if (!apiKey) {
    console.error('❌ Missing SHIPPO_API_KEY in .env.local');
    process.exit(1);
}

// Normalize the API key like the main app does
const normalizedKey = apiKey.startsWith('shippo_') ? apiKey : `shippo_test_${apiKey}`;

const shippo = new Shippo({
    apiKeyHeader: normalizedKey
});

async function testConnectivity() {
    console.log('--- Shippo Connectivity Ritual ---');
    console.log(`Using Key Fragment: ${normalizedKey.slice(0, 15)}...`);

    try {
        // List carrier accounts - simple authenticated call
        console.log('Synchronizing with Logistics Matrix...');
        const carriers = await shippo.carrierAccounts.list({});

        if (carriers && Array.isArray(carriers.results)) {
            console.log(`✅ Connection Established. Meta-Data: ${carriers.results.length} carrier patterns synchronized.`);
            carriers.results.forEach((c: any) => {
                console.log(`   - [${c.carrier.toUpperCase()}] status: ${c.active ? 'ACTIVE' : 'INACTIVE'}`);
            });
            console.log('\n--- Logistics Oracle Status: ONLINE ---');
        } else {
            console.warn('⚠️ Connection successful but no carrier accounts found.');
        }
    } catch (error: any) {
        console.error('❌ Logistics Matrix Sync Failed.');
        console.error(`Reason: ${error.message || 'Unknown protocol error'}`);
        if (error.status === 401) {
            console.error('Hint: Unauthorized. Please verify your SHIPPO_API_KEY at https://goshippo.com/docs/intro/');
        }
    }
}

testConnectivity();
