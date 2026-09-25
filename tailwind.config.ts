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
