import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

// Lint de fronteira (FE-0). Regra alvo do refactor:
// app → features → lib/components/types; feature ↛ feature.
// Ver frontend-next/docs/arquitetura-frontend.md, seções 2–3 e 12 (FE-2/FE-3).
//
// Flat config não acumula a mesma regra entre objetos que casam o mesmo arquivo —
// o último vence. Por isso cada escopo abaixo lista o conjunto COMPLETO de
// patterns que se aplicam a ele (os mais específicos repetem os do escopo pai).
const NO_UP_RELATIVE = {
  group: ["../**"],
  message:
    "Fora de features/, use o alias @/ — imports que sobem de pasta contornam o lint de fronteira.",
}
const NO_CLERK_DIRECT = {
  group: ["@clerk/nextjs"],
  message: "Use o seam @/lib/auth-client (bypass E2E da FE-0), não o Clerk direto.",
}
const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
})

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts vendorizados da skill impeccable — não são código do app.
    ".claude/**",
    // Artefatos do Playwright (PR-4).
    "playwright-report/**",
    "test-results/**",
  ]),

  { linterOptions: { reportUnusedDisableDirectives: "error" } },

  // Teto de linhas — warning (ratchet visível, não gate). skipBlankLines +
  // skipComments tiram types/api.ts (espelho de DTO) da lista sem exceção.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },

  // 1. Camada base: lib/store/types/constants não importa de camadas acima.
  {
    files: ["src/lib/**", "src/store/**", "src/types/**", "src/constants/**"],
    rules: restrict(
      {
        group: ["@/components/**", "@/hooks/**", "@/app/**", "@/features/**"],
        message:
          "Camada base (lib/store/types/constants) não importa de components/, hooks/, app/ ou features/.",
      },
      NO_UP_RELATIVE,
    ),
  },

  // 2. hooks/: abaixo de components e app.
  {
    files: ["src/hooks/**"],
    rules: restrict(
      {
        group: ["@/components/**", "@/app/**", "@/features/**"],
        message: "hooks/ não importa de components/, app/ ou features/.",
      },
      NO_UP_RELATIVE,
      NO_CLERK_DIRECT,
    ),
  },

  // 3. components/ (genérico — tax, tribia, raiz).
  {
    files: ["src/components/**"],
    rules: restrict(
      {
        group: ["@/app/**", "@/features/**"],
        message: "components/ não importa de app/ nem de features/.",
      },
      NO_UP_RELATIVE,
      NO_CLERK_DIRECT,
    ),
  },

  // 4a. shell/: chrome genérico do app — não importa do domínio tax.
  {
    files: ["src/components/shell/**"],
    rules: restrict(
      {
        group: ["@/app/**", "@/features/**", "@/components/tax/**"],
        message: "shell/ é chrome genérico: não importa de app/, features/ nem components/tax.",
      },
      NO_UP_RELATIVE,
      NO_CLERK_DIRECT,
    ),
  },

  // 4b. ui/: o mais genérico de todos — só ui/, lib/ e types/.
  {
    files: ["src/components/ui/**"],
    rules: restrict(
      {
        group: [
          "@/app/**",
          "@/features/**",
          "@/components/tax/**",
          "@/components/tribia/**",
          "@/components/shell/**",
        ],
        message: "ui/ só importa de ui/, lib/ e types/.",
      },
      NO_UP_RELATIVE,
      NO_CLERK_DIRECT,
    ),
  },

  // 5. app/: página ↛ página; de uma feature só a raiz pública.
  {
    files: ["src/app/**"],
    rules: restrict(
      {
        group: ["@/app/**"],
        message:
          "Página não importa de página; extraia para components/ (hoje) ou features/ (FE-2).",
      },
      {
        group: ["@/features/*/**"],
        message: "app/ só importa a raiz pública de uma feature (@/features/<nome>).",
      },
      NO_UP_RELATIVE,
    ),
  },

  // 6. app/dashboard/: idem 5 + seam de auth obrigatório (PR-3).
  {
    files: ["src/app/dashboard/**"],
    rules: restrict(
      { group: ["@/app/**"], message: "Página não importa de página." },
      { group: ["@/features/*/**"], message: "app/ só importa a raiz pública de uma feature." },
      NO_UP_RELATIVE,
      NO_CLERK_DIRECT,
    ),
  },

  // 7. features/ (regra futura — ativa desde já; zero arquivos hoje).
  // Isolamento total entre features: dentro da própria feature use import
  // relativo (por isso NO_UP_RELATIVE não entra aqui); para partilhar entre
  // features, promova a lib/ ou components/.
  {
    files: ["src/features/**"],
    rules: restrict(
      {
        group: ["@/features/*", "@/features/*/**"],
        message:
          "feature ↛ feature. Dentro da própria feature use import relativo; para partilhar, promova a lib/ ou components/.",
      },
      { group: ["@/app/**"], message: "features/ não importa de app/." },
      NO_CLERK_DIRECT,
    ),
  },
])

export default eslintConfig
