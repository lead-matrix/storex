import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./features/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0B0B0D",
                surface: "#121214",
                border: "#1F1F22",
                primary: "#D4AF37", // luxury gold
                textPrimary: "#F5F5F7",
                textSecondary: "#A1A1AA",
                // Legacy support
                black: "#000000",
                obsidian: "#0f0f0f",
                gold: {
                    DEFAULT: "#C6A75E",
                    light: "#D4AF37",
                    dark: "#A68A4C",
                },
                luxury: {
                    text: "#ffffff",
                    subtext: "#b3b3b3",
                    border: "rgba(255,255,255,0.08)",
                }
            },

            fontFamily: {
                playfair: ["var(--font-playfair)", "serif"],
                inter: ["var(--font-inter)", "sans-serif"],
                serif: ["var(--font-playfair)", "serif"],
                sans: ["var(--font-inter)", "sans-serif"],
            },

            borderRadius: {
                luxury: "14px",
            },

            boxShadow: {
                gold: "0 0 20px rgba(198, 167, 94, 0.15)",
                luxury: "0 8px 32px rgba(0,0,0,0.5)",
            },

            spacing: {
                section: "120px",
            },

            letterSpacing: {
                luxury: "0.04em",
                wide: "0.15em",
            },

            transitionTimingFunction: {
                luxury: "cubic-bezier(0.4, 0, 0.2, 1)",
            },
        },
    },
    plugins: [],
};

export default config;
