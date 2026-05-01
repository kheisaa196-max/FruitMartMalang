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
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        navy: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#1e40af",
          600: "#1d4ed8",
          700: "#1e3a8a",
          800: "#1e3a8a",
          900: "#1e2a5e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
