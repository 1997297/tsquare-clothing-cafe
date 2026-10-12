import type { Config } from "tailwindcss";

const themeColor = (name: string) => `rgb(var(--theme-${name}) / <alpha-value>)`;
// Existing status utility names share semantic colours instead of fixed dark-only shades.
const statusPalette = (name: string) => ({
  100: themeColor(name),
  200: themeColor(name), 300: themeColor(name), 400: themeColor(name),
  500: themeColor(name), 600: themeColor(name), 700: themeColor(`${name}-border`),
  800: themeColor(`${name}-border`), 900: themeColor(`${name}-border`),
  950: themeColor(`${name}-surface`),
});

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: themeColor("page"),
        surface: { DEFAULT: themeColor("surface"), elevated: themeColor("elevated"), hover: themeColor("hover") },
        ink: { DEFAULT: themeColor("text"), secondary: themeColor("secondary"), muted: themeColor("muted") },
        line: themeColor("border"),
        control: themeColor("control-border"),
        focus: themeColor("focus"),
        accent: { DEFAULT: themeColor("accent"), hover: themeColor("accent-hover") },
        action: { DEFAULT: themeColor("action"), hover: themeColor("action-hover") },
        "on-action": themeColor("on-action"),
        photo: { DEFAULT: themeColor("photo-text"), secondary: themeColor("photo-secondary"), accent: themeColor("photo-accent") },
        success: statusPalette("success"), warning: statusPalette("warning"),
        error: statusPalette("error"), pending: { DEFAULT: themeColor("pending"), surface: themeColor("pending-surface"), border: themeColor("pending-border") },
        emerald: statusPalette("success"), green: statusPalette("success"),
        amber: statusPalette("warning"), yellow: statusPalette("warning"),
        red: statusPalette("error"), rose: statusPalette("error"),
        blue: statusPalette("info"), cyan: statusPalette("info"),
        violet: statusPalette("progress"), purple: statusPalette("progress"),
        "near-black": "rgb(var(--color-near-black) / <alpha-value>)",
        "warm-ivory": "rgb(var(--color-warm-ivory) / <alpha-value>)",
        "warm-ivory-light": "rgb(var(--color-warm-ivory-light) / <alpha-value>)",
        espresso: "rgb(var(--color-espresso) / <alpha-value>)",
        stone: {
          DEFAULT: "rgb(var(--color-stone-500) / <alpha-value>)",
          50: "rgb(var(--color-stone-50) / <alpha-value>)",
          100: "rgb(var(--color-stone-100) / <alpha-value>)",
          200: "rgb(var(--color-stone-200) / <alpha-value>)",
          300: "rgb(var(--color-stone-300) / <alpha-value>)",
          400: "rgb(var(--color-stone-400) / <alpha-value>)",
          500: "rgb(var(--color-stone-500) / <alpha-value>)",
          600: "rgb(var(--color-stone-600) / <alpha-value>)",
          700: "rgb(var(--color-stone-700) / <alpha-value>)",
          800: "rgb(var(--color-stone-800) / <alpha-value>)",
          900: "rgb(var(--color-stone-900) / <alpha-value>)",
          950: "rgb(var(--color-stone-950) / <alpha-value>)",
        },
        champagne: {
          DEFAULT: "rgb(var(--color-champagne) / <alpha-value>)",
          light: "rgb(var(--color-champagne-light) / <alpha-value>)",
          dark: "rgb(var(--color-champagne-dark) / <alpha-value>)",
        },
      },
      fontFamily: {
        clash: ["var(--font-clash)", "sans-serif"],
        display: ["var(--font-cinzel)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.2em",
        ultra: "0.3em",
      },
    },
  },
  plugins: [],
};

export default config;
