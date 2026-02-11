import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{tsx,jsx}", // More specific extensions
    "./components/**/*.{tsx,jsx}",
    "./app/**/*.{tsx,jsx}",
    "!./node_modules", // Explicit exclusion
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        // OKLCH Color System
        primary: "oklch(0.65 0.25 265)",
        "primary-hover": "oklch(0.6 0.25 265)",
        secondary: "oklch(0.7 0.15 285)",
        accent: "oklch(0.75 0.2 145)",

        // Light mode
        background: "oklch(0.98 0.01 285)",
        foreground: "oklch(0.15 0.02 285)",
        muted: "oklch(0.92 0.02 285)",
        "muted-foreground": "oklch(0.45 0.02 285)",
        border: "oklch(0.88 0.02 285)",

        // Dark mode
        "background-dark": "oklch(0.12 0.02 285)",
        "foreground-dark": "oklch(0.95 0.01 285)",
        "muted-dark": "oklch(0.18 0.02 285)",
        "muted-foreground-dark": "oklch(0.6 0.02 285)",
        "border-dark": "oklch(0.25 0.02 285)",

        // Glass
        "glass-light": "oklch(0.98 0.01 285)",
        "glass-dark": "oklch(0.15 0.02 285)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgb(0 0 0 / 0.1)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
