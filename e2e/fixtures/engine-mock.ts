// Mock do backend Go via interceptação de rede do Playwright — sem MSW
// (decisão da FE-0, ver docs/arquitetura-frontend.md §11). Todas as chamadas
// do app partem do browser (inclusive o dossiê público, same-origin), então
// um único page.route por origem cobre o fluxo inteiro.
import type { Page, Route } from "@playwright/test"
import type { BatchClassificationResponse, SimulationResponse } from "@/types/api"
import {
  E2E_RECORD_ID,
  QUOTA_FIXTURE,
  RECORD_DETAIL_FIXTURE,
  SAVE_RECORD_FIXTURE,
  SIMULATION_FIXTURE,
} from "./data"

const API_ORIGIN = "http://127.0.0.1:8080"

// fetch cross-origin com Content-Type: application/json dispara preflight —
// respondemos OPTIONS e devolvemos CORS em toda resposta fulfilled.
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-user-id,x-tribia-plan",
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    body: JSON.stringify(body),
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  })
}

/**
 * Ecoa o `client_id` de cada item enviado. Sem o eco, `mapByClientId`
 * (src/hooks/use-simulation.ts) cai no fallback por description e
 * `is_eligible` vira false — o veredito e o CTA do dossiê saem errados.
 */
function classifyEcho(expenses: { client_id?: string; description: string }[]): BatchClassificationResponse {
  return {
    total: expenses.length,
    processed: expenses.length,
    results: expenses.map((e) => ({
      client_id: e.client_id,
      description: e.description,
      is_eligible: true,
      confidence: 0.92,
      justification: "Insumo elegível a crédito (fixture E2E).",
      legal_base: "Art. 47, LC 68/2024",
      risk_level: "baixo",
      regime_type: "padrao",
      evidence: [],
    })),
  }
}

export interface MockEngineOptions {
  /**
   * Respostas sucessivas de POST /simulations, na ordem das chamadas (a N-ésima
   * chamada usa responses[N-1]; a última entrada repete se a lista esgotar).
   * Omitido = sempre SIMULATION_FIXTURE (comportamento do smoke, intocado).
   */
  simulationResponses?: SimulationResponse[]
}

export interface MockEngineHandle {
  simulationsCallCount(): number
  simulationRecordsCallCount(): number
}

export async function mockEngine(page: Page, opts: MockEngineOptions = {}): Promise<MockEngineHandle> {
  let simulationsCalls = 0
  let simulationRecordsCalls = 0

  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const req = route.request()
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS })
    }

    const pathname = new URL(req.url()).pathname

    if (pathname === "/credit-classifications/batch" && req.method() === "POST") {
      const body = req.postDataJSON() as { expenses: { client_id?: string; description: string }[] }
      return json(route, 200, classifyEcho(body.expenses))
    }
    if (pathname === "/simulations" && req.method() === "POST") {
      const responses = opts.simulationResponses
      const body = responses
        ? responses[Math.min(simulationsCalls, responses.length - 1)]
        : SIMULATION_FIXTURE
      simulationsCalls++
      return json(route, 200, body)
    }
    if (pathname === "/simulation-records" && req.method() === "POST") {
      simulationRecordsCalls++
      return json(route, 201, SAVE_RECORD_FIXTURE)
    }
    if (pathname === "/plg/quota" && req.method() === "GET") {
      return json(route, 200, QUOTA_FIXTURE)
    }
    if (pathname === "/strategy-tags" && req.method() === "GET") {
      return json(route, 200, { tags: [] })
    }
    if (pathname === "/companies" && req.method() === "GET") {
      return json(route, 200, [])
    }

    // Rota do motor não mockada: falha alto em vez de deixar a requisição
    // real vazar (nada escuta em API_ORIGIN de qualquer forma).
    return json(route, 500, { error: `rota do motor não mockada: ${req.method()} ${pathname}` })
  })

  // Dossiê público: no browser a URL é SAME-ORIGIN (/api/public/...) — o
  // route intercepta antes do route handler do Next encaminhar ao engine.
  await page.route("**/api/public/simulation-records/*", (route) =>
    json(route, 200, RECORD_DETAIL_FIXTURE),
  )

  return {
    simulationsCallCount: () => simulationsCalls,
    simulationRecordsCallCount: () => simulationRecordsCalls,
  }
}

export { E2E_RECORD_ID }
