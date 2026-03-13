import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "oklch(var(--rf-bg) / <alpha-value>)",
        surface: "oklch(var(--rf-surface) / <alpha-value>)",
        card: "oklch(var(--rf-card) / <alpha-value>)",
        border: "oklch(var(--rf-border) / <alpha-value>)",
        fg: "oklch(var(--rf-text) / <alpha-value>)",
        muted: "oklch(var(--rf-muted) / <alpha-value>)",
        accent: "oklch(var(--rf-accent) / <alpha-value>)",
        "accent-ink": "oklch(var(--rf-accent-ink) / <alpha-value>)",
        danger: "oklch(var(--rf-danger) / <alpha-value>)",
        "danger-surface": "oklch(var(--rf-danger-surface) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--rf-font-sans)"],
        display: ["var(--rf-font-display)"],
      },
      spacing: {
        2: "var(--rf-space-2)",
        3: "var(--rf-space-3)",
        4: "var(--rf-space-4)",
        6: "var(--rf-space-6)",
        8: "var(--rf-space-8)",
      },
      borderRadius: {
        xl: "1rem",
      },
      boxShadow: {
        soft: "0 12px 30px -18px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
