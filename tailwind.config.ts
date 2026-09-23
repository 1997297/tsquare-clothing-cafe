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
        "near-black": "#11110F",
        "warm-ivory": "#F3EFE7",
        "warm-ivory-light": "#FAF7F2",
        espresso: "#30251F",
        stone: {
          DEFAULT: "#A79C8C",
          50: "#F7F6F4",
          100: "#EFECE8",
          200: "#DDD7CE",
          300: "#C6BDAD",
          400: "#B3A694",
          500: "#A79C8C",
          600: "#8B7F6F",
          700: "#6C6153",
          800: "#494137",
          900: "#2B2620",
        },
        champagne: {
          DEFAULT: "#B79A68",
          light: "#D1B88B",
          dark: "#967A49",
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
