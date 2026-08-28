// Mock do backend Go via interceptação de rede do Playwright — sem MSW
// (decisão da FE-0, ver docs/arquitetura-frontend.md §11). Todas as chamadas
// do app partem do browser (inclusive o dossiê público, same-origin), então
// um único page.route por origem cobre o fluxo inteiro.
import type { Page, Route } from "@playwright/test"
import type {
  BatchClassificationResponse,
  CompanyTemplate,
  SimulationRecordCreatePayload,
  SimulationRecordSummary,
  SimulationResponse,
} from "@/types/api"
import type { PlgQuotaResponse } from "@/lib/api"
import type { LawCorpusResponse } from "@/lib/api/legal"
import type { EngineValidationResponse } from "@/lib/api/engine"
import {
  E2E_RECORD_ID,
  ENGINE_VALIDATION_FIXTURE,
  LAW_CORPUS_FIXTURE,
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
      // Âncora real: o prefixo lc68_ é o que o selo de base legal usa para
      // saber qual documento este dossiê citou (Onda 2/PR 2). Em produção
      // toda classificação carrega evidência — é o que a torna auditável.
      evidence: [{ article_id: "lc68_0047_art_47", content: "Trecho normativo (fixture E2E).", similarity: 0.86 }],
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
  /** GET /companies inicial (FE-4/PR 4f). Omitido = [] (comportamento anterior). */
  companies?: CompanyTemplate[]
  /**
   * GET /simulation-records inicial (FE-4/PR 4f), antes de qualquer POST desta
   * sessão. Cada POST /simulation-records desta sessão soma uma linha
   * sintetizada ao estado do mock — GET reflete o que foi persistido.
   */
  records?: SimulationRecordSummary[]
  /** GET /plg/quota. Omitido = QUOTA_FIXTURE (pro, sem enforcement). */
  quota?: PlgQuotaResponse
  /** GET /law/corpus (W1/PR 8). Omitido = LAW_CORPUS_FIXTURE. */
  lawCorpus?: LawCorpusResponse
  /** GET /engine/validation (W7/PR 6). Omitido = ENGINE_VALIDATION_FIXTURE. */
  engineValidation?: EngineValidationResponse
  /**
   * Chamadas de POST /simulations (1-indexed, na ordem de chegada) que devem
   * falhar com 500 — cobre o retry de recálculo visível (Etapa M/PR 8).
   */
  failSimulationCalls?: number[]
  /**
   * Chamadas de POST /simulation-records (1-indexed) que devem falhar com
   * 500 — cobre o retry de persistência visível (Etapa M/PR 8).
   */
  failSimulationRecordCalls?: number[]
}

/** Sintetiza uma linha de listagem a partir do corpo do POST /simulation-records. */
function summaryFromCreatePayload(
  body: SimulationRecordCreatePayload,
  id: string,
): SimulationRecordSummary {
  return {
    id,
    created_at: "2026-08-27T12:00:00.000Z",
    year: body.year,
    company_id: body.company_id ?? null,
    company_context: body.company_context,
    delta_impact: body.simulation?.delta ?? "0.00",
    total_projected_tax: body.simulation?.projected?.net_tax ?? "0.00",
    transition_series: [],
  }
}

export interface MockEngineHandle {
  simulationsCallCount(): number
  simulationRecordsCallCount(): number
}

export async function mockEngine(page: Page, opts: MockEngineOptions = {}): Promise<MockEngineHandle> {
  let simulationsCalls = 0
  let simulationRecordsCalls = 0
  const records: SimulationRecordSummary[] = [...(opts.records ?? [])]

  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const req = route.request()
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(req.url())
    const pathname = url.pathname

    if (pathname === "/credit-classifications/batch" && req.method() === "POST") {
      const body = req.postDataJSON() as { expenses: { client_id?: string; description: string }[] }
      return json(route, 200, classifyEcho(body.expenses))
    }
    if (pathname === "/simulations" && req.method() === "POST") {
      simulationsCalls++
      if (opts.failSimulationCalls?.includes(simulationsCalls)) {
        return json(route, 500, { error: "falha simulada de rede (fixture E2E)", request_id: "e2e-sim-fail" })
      }
      const responses = opts.simulationResponses
      const body = responses
        ? responses[Math.min(simulationsCalls - 1, responses.length - 1)]
        : SIMULATION_FIXTURE
      return json(route, 200, body)
    }
    if (pathname === "/simulation-records" && req.method() === "POST") {
      simulationRecordsCalls++
      if (opts.failSimulationRecordCalls?.includes(simulationRecordsCalls)) {
        return json(route, 500, { error: "falha simulada de rede (fixture E2E)", request_id: "e2e-persist-fail" })
      }
      const body = req.postDataJSON() as SimulationRecordCreatePayload
      records.unshift(summaryFromCreatePayload(body, SAVE_RECORD_FIXTURE.id))
      return json(route, 201, SAVE_RECORD_FIXTURE)
    }
    if (pathname === "/simulation-records" && req.method() === "GET") {
      const companyId = url.searchParams.get("company_id")
      const limit = Number(url.searchParams.get("limit") ?? "20")
      const filtered = companyId ? records.filter((r) => r.company_id === companyId) : records
      return json(route, 200, filtered.slice(0, limit))
    }
    if (pathname === "/plg/quota" && req.method() === "GET") {
      return json(route, 200, opts.quota ?? QUOTA_FIXTURE)
    }
    if (pathname === "/strategy-tags" && req.method() === "GET") {
      return json(route, 200, { tags: [] })
    }
    if (pathname === "/companies" && req.method() === "GET") {
      return json(route, 200, opts.companies ?? [])
    }
    if (pathname === "/law/corpus" && req.method() === "GET") {
      return json(route, 200, opts.lawCorpus ?? LAW_CORPUS_FIXTURE)
    }
    if (pathname === "/engine/validation" && req.method() === "GET") {
      return json(route, 200, opts.engineValidation ?? ENGINE_VALIDATION_FIXTURE)
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
