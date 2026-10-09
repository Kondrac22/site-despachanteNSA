import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// O eslint-config-next 15 ainda vem no formato antigo de configuração;
// o FlatCompat converte para o formato novo do ESLint 9.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // As consultas do Supabase com relacionamentos ainda usam `any`;
      // fica como aviso até termos os tipos gerados do banco.
      "@typescript-eslint/no-explicit-any": "warn",
      // Aspas em textos em português são normais no JSX.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
