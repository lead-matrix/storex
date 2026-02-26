import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./lib/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    primary: "#050505",
                    secondary: "#0C0A08",
                    card: "#0D0D0F",
                },
                gold: {
                    DEFAULT: "#D4AF37",
                    soft: "rgba(212,175,55,0.12)",
                    hover: "#B8962E",
                    accent: "#F5E07C",
                    muted: "rgba(212,175,55,0.5)",
                },
                text: {
                    primary: "#F3EFE8",
                    secondary: "#DAD5CC",
                    muted: "#A9A39A",
                    subtle: "#6B6560",
                },
                border: {
                    gold: "rgba(212,175,55,0.2)",
                    subtle: "rgba(255,255,255,0.06)",
                },
                status: {
                    success: "#3BB273",
                    error: "#D64545",
                    warning: "#F59E0B",
                    info: "#3B82F6",
                },
            },
            fontFamily: {
                serif: ["var(--font-playfair)", "Georgia", "serif"],
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
            borderRadius: {
                sm: "8px",
                DEFAULT: "12px",
                lg: "16px",
                xl: "20px",
            },
            boxShadow: {
                gold: "0 0 20px rgba(212,175,55,0.3)",
                "gold-soft": "0 10px 40px rgba(212,175,55,0.1)",
                "gold-lg": "0 0 40px rgba(212,175,55,0.25), 0 0 80px rgba(212,175,55,0.1)",
                card: "0 4px 24px rgba(0,0,0,0.4)",
                "card-hover": "0 8px 40px rgba(0,0,0,0.6)",
            },
            transitionDuration: {
                DEFAULT: "300ms",
                fast: "150ms",
                slow: "500ms",
            },
            animation: {
                "gold-pulse": "gold-pulse 2.5s ease-in-out infinite",
                "count-up": "count-up 0.8s cubic-bezier(0.4,0,0.2,1) forwards",
                "slide-up": "slide-up 0.6s cubic-bezier(0.4,0,0.2,1) forwards",
            },
            keyframes: {
                "gold-pulse": {
                    "0%, 100%": { borderColor: "rgba(212,175,55,0.12)" },
                    "50%": { borderColor: "rgba(212,175,55,0.4)" },
                },
                "count-up": {
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "slide-up": {
                    from: { opacity: "0", transform: "translateY(16px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
            },
            spacing: {
                "safe-bottom": "env(safe-area-inset-bottom, 12px)",
            },
        },
    },
    plugins: [],
};

export default config;
