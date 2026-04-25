import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070A",
          900: "#0B1220",
          800: "#111B2E",
          700: "#1A2945",
        },
        paper: {
          50: "#FBFBFA",
          100: "#F6F6F3",
        },
        mist: {
          50: "#F7F8FA",
          100: "#EEF1F5",
          200: "#E2E7EE",
        },
        forest: {
          900: "#07190B",
          800: "#0B2410",
          700: "#123418",
          600: "#1B4B25",
          500: "#276634",
          400: "#3D8B4E",
          300: "#62AD73",
          200: "#9ED5A9",
          100: "#D5F0DA",
          50: "#EEF9F0",
        },
        amber: {
          500: "#BA7517",
          200: "#f5c842",
          100: "#fdefc0",
          50: "#fffbeb",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.06), 0 8px 24px rgba(16, 24, 40, 0.08)",
        lift: "0 2px 6px rgba(16, 24, 40, 0.10), 0 14px 40px rgba(16, 24, 40, 0.10)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        blink: "blink 2s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

