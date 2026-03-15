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
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "NEXT_PUBLIC_CHATBOT_ID",
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
        console.error(msg);
        // During build or dev, we always log. In prod runtime, we only throw if explicitly desired.
        // For now, let's just log to avoid 500ing the whole app.
    }

    if (missingSecondary.length > 0) {
        console.warn(`⚠️ Warning: Missing secondary environment variables (some features may be disabled): ${missingSecondary.join(", ")}`);
    }
}
