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
                pearl: "#F6F3EE",
                champagne: "#E9E1D8",
                nude: "#E2D6C8",
                gold: "#C6A85C",
                charcoal: "#1F1F1F",
                textsoft: "#6E6A66",
            },

            fontFamily: {
                heading: ["var(--font-playfair)", "Playfair Display", "serif"],
                body: ["var(--font-inter)", "Inter", "sans-serif"],
            },

            borderRadius: {
                luxury: "14px",
            },

            boxShadow: {
                luxury: "0 8px 24px rgba(0,0,0,0.06)",
                soft: "0 4px 12px rgba(0,0,0,0.04)",
            },

            spacing: {
                section: "6rem",
            },

            letterSpacing: {
                luxury: "0.04em",
            },

            transitionTimingFunction: {
                luxury: "cubic-bezier(0.4, 0, 0.2, 1)",
            },
        },
    },
    plugins: [],
};

export default config;
