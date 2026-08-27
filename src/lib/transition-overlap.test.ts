import { describe, expect, it } from "vitest"
import type { TransitionSeriesPoint } from "@/types/api"
import {
  buildDualComplianceYearSet,
  computeOverlapBand,
  isDualCompliancePoint,
} from "./transition-overlap"

/**
 * Strings espelham StringFixed(6) do motor Go (transitionYearFactorsFromRules).
 * Valores alinhados a RulesForYear + ISSMunicipalTransitionFactor em
 * backend-engine-go/internal/tax/rules.go.
 */
function makePoint(
  year: number,
  pisCofins: string,
  cbs: string,
  ibs: string,
  issMunicipal: string,
): TransitionSeriesPoint {
  return {
    year,
    old_tax_net: "100.00",
    new_tax_net: "200.00",
    total_tax_net: "300.00",
    factors: {
      year,
      pis_cofins_factor: pisCofins,
      cbs_rate: cbs,
      ibs_rate: ibs,
      iss_municipal_factor: issMunicipal,
    },
  }
}

// Pontos canónicos (StringFixed(6) do Go, W7/B2.2: PIS/COFINS extinto a
// partir de 2027 — não sobra ano 2027-2032 em que pis_cofins_factor > 0;
// a convivência nesse intervalo é sustentada só pelo ISS municipal).
// 2026: PIS/COFINS=1, CBS=0.9%, IBS=0.1%, ISS=100% → convivência
const p2026 = makePoint(2026, "1.000000", "0.009000", "0.001000", "1.000000")
// 2031: PIS/COFINS extinto, CBS=8.8%, IBS=5.31%, ISS=70% → convivência (via ISS)
const p2031 = makePoint(2031, "0.000000", "0.088000", "0.053100", "0.700000")
// 2032: PIS/COFINS extinto, CBS=8.8%, IBS=7.08%, ISS=60% → convivência (ISS ainda vivo!)
const p2032 = makePoint(2032, "0.000000", "0.088000", "0.070800", "0.600000")
// 2033: PIS/COFINS=0, CBS=8.8%, IBS=17.7%, ISS=0 → FORA da convivência
const p2033 = makePoint(2033, "0.000000", "0.088000", "0.177000", "0.000000")

const fullSeries = [p2026, p2031, p2032, p2033]

// ─── isDualCompliancePoint ───────────────────────────────────────────────────

describe("isDualCompliancePoint", () => {
  it("2026 — PIS/COFINS pleno + CBS/IBS em teste → convivência", () => {
    expect(isDualCompliancePoint(p2026)).toBe(true)
  })

  it("2031 — PIS/COFINS extinto mas ISS ainda vivo → convivência (via ISS)", () => {
    expect(isDualCompliancePoint(p2031)).toBe(true)
  })

  it("2032 — PIS/COFINS zerado MAS ISS ainda existe → convivência (detalhe ISS)", () => {
    expect(isDualCompliancePoint(p2032)).toBe(true)
  })

  it("2033 — PIS/COFINS e ISS zerados → FORA da convivência", () => {
    expect(isDualCompliancePoint(p2033)).toBe(false)
  })

  it("ponto sem factors → false (sem mentira silenciosa)", () => {
    const noFactors: TransitionSeriesPoint = {
      year: 2028,
      old_tax_net: "100.00",
      new_tax_net: "200.00",
      total_tax_net: "300.00",
    }
    expect(isDualCompliancePoint(noFactors)).toBe(false)
  })

  it("iss_municipal_factor ausente não bloqueia detecção se pis_cofins > 0", () => {
    const p: TransitionSeriesPoint = {
      year: 2027,
      old_tax_net: "100.00",
      new_tax_net: "200.00",
      total_tax_net: "300.00",
      factors: {
        year: 2027,
        pis_cofins_factor: "0.700000",
        cbs_rate: "0.015000",
        ibs_rate: "0.035000",
        // iss_municipal_factor ausente (registo legado)
      },
    }
    expect(isDualCompliancePoint(p)).toBe(true)
  })
})

// ─── computeOverlapBand ──────────────────────────────────────────────────────

describe("computeOverlapBand", () => {
  it("série undefined → null", () => {
    expect(computeOverlapBand(undefined)).toBeNull()
  })

  it("série vazia → null", () => {
    expect(computeOverlapBand([])).toBeNull()
  })

  it("série com apenas 2033 → null (nenhum ponto em convivência)", () => {
    expect(computeOverlapBand([p2033])).toBeNull()
  })

  it("série completa → banda 2026–2032 (2033 excluído)", () => {
    const band = computeOverlapBand(fullSeries)
    expect(band).not.toBeNull()
    expect(band!.startYear).toBe(2026)
    expect(band!.endYear).toBe(2032)
  })

  it("série desordenada → resultado idêntico (sort interno)", () => {
    const desordenada = [p2033, p2032, p2026, p2031]
    const band = computeOverlapBand(desordenada)
    expect(band!.startYear).toBe(2026)
    expect(band!.endYear).toBe(2032)
  })

  it("série apenas com 2032 → banda 2032–2032 (ISS mantém convivência)", () => {
    const band = computeOverlapBand([p2032])
    expect(band!.startYear).toBe(2032)
    expect(band!.endYear).toBe(2032)
  })
})

// ─── buildDualComplianceYearSet ─────────────────────────────────────────────

describe("buildDualComplianceYearSet", () => {
  it("série completa → Set contém 2026, 2031, 2032; NÃO contém 2033", () => {
    const set = buildDualComplianceYearSet(fullSeries)
    expect(set.has(2026)).toBe(true)
    expect(set.has(2031)).toBe(true)
    expect(set.has(2032)).toBe(true)
    expect(set.has(2033)).toBe(false)
  })

  it("série undefined → Set vazio", () => {
    expect(buildDualComplianceYearSet(undefined).size).toBe(0)
  })

  it("fonte partilhada: Set e Band concordam nos anos incluídos", () => {
    const set = buildDualComplianceYearSet(fullSeries)
    const band = computeOverlapBand(fullSeries)!
    expect(set.has(band.startYear)).toBe(true)
    expect(set.has(band.endYear)).toBe(true)
    expect(set.has(band.endYear + 1)).toBe(false)
  })
})
