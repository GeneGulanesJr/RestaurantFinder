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
        "accent-light": "oklch(var(--rf-accent-3) / <alpha-value>)",
        success: "oklch(var(--rf-success) / <alpha-value>)",
        "success-surface": "oklch(var(--rf-success-surface) / <alpha-value>)",
        danger: "oklch(var(--rf-danger) / <alpha-value>)",
        "danger-surface": "oklch(var(--rf-danger-surface) / <alpha-value>)",
        rating: "oklch(var(--rf-rating) / <alpha-value>)",
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
        12: "var(--rf-space-12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "var(--rf-shadow-soft)",
        card: "var(--rf-shadow-card)",
        hover: "var(--rf-shadow-hover)",
      },
    },
  },
  plugins: [],
} satisfies Config;
