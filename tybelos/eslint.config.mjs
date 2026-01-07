import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  { ignores: [".next/**", "node_modules/**", "public/sw.js"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Next.js rules (flat config supported by the plugin)
  nextPlugin.configs["core-web-vitals"]
];

