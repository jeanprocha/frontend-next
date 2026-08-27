import path from "path"
import { defineConfig } from "vitest/config"

const alias = { "@": path.resolve(__dirname, "./src") }

export default defineConfig({
  test: {
    // `passWithNoTests` é uma opção de nível raiz (NonProjectOptions) no vitest 4 —
    // não existe por projeto. Aplica-se à rodada inteira.
    passWithNoTests: true,
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.dom.ts"],
        },
      },
    ],
  },
})
