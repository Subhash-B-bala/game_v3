import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "var(--primary)",
                secondary: "var(--secondary)",
                surface: "var(--surface)",
                "surface-highlight": "var(--surface-highlight)",
                highlight: "var(--highlight)",
                success: "var(--success)",
                warning: "var(--warning)",
                error: "var(--error)",
            },
            fontFamily: {
                sans: ["var(--font-kanit)", "sans-serif"],
                display: ["var(--font-saira)", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
