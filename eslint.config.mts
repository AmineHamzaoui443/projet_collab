import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  // 1. GLOBAL IGNORES
  { ignores: ["dist", "node_modules", "coverage"] },

  // 2. Base Configs
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,

  // 3. Global Settings & Rules
  {
    // Apply these settings globally (to all files) to fix the warning
    languageOptions: { 
      globals: globals.browser 
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off"
    }
  }
];