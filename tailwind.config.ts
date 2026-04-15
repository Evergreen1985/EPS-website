import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fredoka", "sans-serif"],
        sans: ["Quicksand", "sans-serif"],
      },
      colors: {
        primary: "#E8694A",
        secondary: "#178F78",
        accent: "#F5B829",
      },
    },
  },
  plugins: [],
};

export default config;
