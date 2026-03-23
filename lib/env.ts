const criticalVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "WAREHOUSE_NAME",
    "WAREHOUSE_ADDRESS_LINE1",
    "WAREHOUSE_CITY",
    "WAREHOUSE_STATE",
    "WAREHOUSE_ZIP",
]

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
    "NEXT_PUBLIC_CHATBASE_HOST",
]

export function validateEnv() {
    const isBuild =
        process.env.npm_lifecycle_event === "build" ||
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.CI === "1" ||
        process.env.SKIP_ENV_VALIDATION === "1"

    const missingCritical = criticalVars.filter((key) => !process.env[key])
    const missingSecondary = secondaryVars.filter((key) => !process.env[key])

    if (missingSecondary.length > 0) {
        console.warn(`⚠️  Missing secondary env vars (some features disabled): ${missingSecondary.join(", ")}`)
    }

    if (missingCritical.length > 0) {
        const msg = `❌ CRITICAL env vars missing: ${missingCritical.join(", ")}`
        if (!isBuild) {
            // Hard crash at runtime so we know immediately — do not silently serve broken pages
            throw new Error(msg)
        } else {
            console.error(msg)
        }
    }
}
