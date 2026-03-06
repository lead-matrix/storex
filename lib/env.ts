const criticalVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

const secondaryVars = [
    "NEXT_PUBLIC_SITE_URL",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "SHIPPO_API_KEY",
];

export function validateEnv() {
    const isBuild =
        process.env.npm_lifecycle_event === "build" ||
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.CI === "1" ||
        process.env.SKIP_ENV_VALIDATION === "1";

    const missingCritical = criticalVars.filter((key) => !process.env[key]);
    const missingSecondary = secondaryVars.filter((key) => !process.env[key]);

    if (missingCritical.length > 0) {
        const msg = `❌ CRITICAL Missing: ${missingCritical.join(", ")}`;
        if (isBuild || process.env.NODE_ENV !== 'production') {
            console.error(msg);
        } else {
            throw new Error(msg);
        }
    }

    if (missingSecondary.length > 0) {
        console.warn(`⚠️ Warning: Missing secondary environment variables (some features may be disabled): ${missingSecondary.join(", ")}`);
    }
}
