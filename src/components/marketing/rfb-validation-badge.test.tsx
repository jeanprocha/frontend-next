import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api"
import type { EngineValidationResponse } from "@/lib/api/engine"
import { RfbValidationBadge } from "./rfb-validation-badge"

const VALIDATED_FIXTURE: EngineValidationResponse = {
  validated: true,
  reference: {
    name: "Calculadora de Tributos RFB/Serpro",
    url: "https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api",
    version: "1.3.0-af611293 (base V0042, 2026-07-07)",
    run_at: "2026-08-28T23:04:55Z",
  },
  scope: ["CBS", "IBS", "regime regular (empresa de serviços)"],
  out_of_scope: ["PIS/COFINS", "ISS", "ICMS"],
  tolerance_brl: "0.01",
  cases: [{ year: 2026, cbs_tribia: "90.00", cbs_rfb: "90.00", ibs_tribia: "10.00", ibs_rfb: "10.00", divergente: false }],
  cases_total: 8,
  cases_divergent: 0,
}

const NOT_VALIDATED_FIXTURE: EngineValidationResponse = {
  validated: false,
  reference: {},
  scope: [],
  out_of_scope: [],
  cases: [],
  cases_total: 0,
  cases_divergent: 0,
}

/** Semeia o cache antes do render — evita depender de um fetch real ao vivo. */
function renderWithQueryData(seedData?: EngineValidationResponse) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (seedData) {
    queryClient.setQueryData(queryKeys.engineValidation.all, seedData)
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <RfbValidationBadge />
    </QueryClientProvider>,
  )
}

describe("RfbValidationBadge", () => {
  it("PRODUCT.md: sem dado ao vivo (query não resolveu), não renderiza nada", () => {
    const { container } = renderWithQueryData()
    expect(container).toBeEmptyDOMElement()
  })

  it("PRODUCT.md: validated:false (sem evidência gravada), não renderiza nada", () => {
    const { container } = renderWithQueryData(NOT_VALIDATED_FIXTURE)
    expect(container).toBeEmptyDOMElement()
  })

  it("com validação ao vivo, mostra o selo com a contagem de anos conferidos", () => {
    renderWithQueryData(VALIDATED_FIXTURE)
    expect(screen.getByRole("note")).toHaveTextContent(
      "Motor validado contra a Calculadora oficial da RFB — 8 anos conferidos, zero divergência",
    )
  })

  it("carrega escopo e versão completos no aria-label/title, para quem quiser conferir", () => {
    renderWithQueryData(VALIDATED_FIXTURE)
    const note = screen.getByRole("note")
    expect(note).toHaveAttribute(
      "aria-label",
      "Validado contra a Calculadora de Tributos RFB versão 1.3.0-af611293 (base V0042, 2026-07-07) — escopo: CBS + IBS + regime regular (empresa de serviços), 8 casos conferidos, 0 divergências",
    )
  })

  // Mesma guarda de motor-validado-selo.tsx: a calculadora é beta e muda de
  // versão — "validado" sem dizer contra qual versão afirma mais do que a
  // evidência sustenta.
  it("validated:true mas sem versão da calculadora, não renderiza nada", () => {
    const { container } = renderWithQueryData({
      ...VALIDATED_FIXTURE,
      reference: { ...VALIDATED_FIXTURE.reference, version: undefined },
    })
    expect(container).toBeEmptyDOMElement()
  })

  it("se cases_divergent viesse > 0 mesmo com validated:true, mostra a contagem em vez de fabricar 'zero'", () => {
    renderWithQueryData({ ...VALIDATED_FIXTURE, cases_divergent: 2 })
    expect(screen.getByRole("note")).toHaveTextContent(
      "Motor validado contra a Calculadora oficial da RFB — 8 anos conferidos, 2 divergência(s)",
    )
  })
})
