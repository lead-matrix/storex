const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "SHIPPO_API_KEY",
];

export function validateEnv() {
    // Skip validation during build phase, especially helpful for Vercel where you might not have all secrets for a preview yet
    if (
        process.env.npm_lifecycle_event === "build" ||
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.CI === "1" ||
        process.env.SKIP_ENV_VALIDATION === "1"
    ) {
        const missing = requiredEnvVars.filter((key) => !process.env[key]);
        if (missing.length > 0) {
            console.warn(`⚠️ Warning: Missing environment variables during build: ${missing.join(", ")}`);
        }
        return;
    }

    const missing = requiredEnvVars.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `❌ Missing required environment variables: ${missing.join(", ")}`
        );
    }
}
