import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        "tap-lg": ["18px", { lineHeight: "26px" }]
      },
      borderRadius: {
        xl: "16px"
      }
    }
  },
  plugins: []
} satisfies Config;

