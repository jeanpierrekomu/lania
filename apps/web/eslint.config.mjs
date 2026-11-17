import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Pantallas del diseño LANIA importadas de Figma Make (src/ui): mientras se conectan a datos reales,
  // se toleran estos patrones del original (estado leído del navegador tras montar, refs de grabación,
  // ilustraciones estáticas con <img>). Se vuelven a activar pantalla por pantalla al migrarlas.
  {
    files: ["src/ui/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/immutability": "off",
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
