import type { SimulationResponse } from "@/types/api"

/** Metadados opcionais (sessão / histórico) para o cabeçalho do CSV. */
export interface MemoryExportMeta {
  sessionCreatedAt?: string
  recordId?: string
}

const SEP = ";"
const EOL = "\r\n"
const UTF8_BOM = "\uFEFF"

function escapeCell(v: string): string {
  const s = String(v ?? "")
  if (/[;\n\r"]/u.test(s)) {
    return `"${s.replace(/"/gu, '""')}"`
  }
  return s
}

function joinLine(cells: string[]): string {
  return cells.map(escapeCell).join(SEP) + EOL
}

function safe(v: string | number | undefined | null): string {
  if (v == null) return "—"
  return String(v)
}

/**
 * Gera o conteúdo UTF-8 (com BOM para Excel) da memória de cálculo determinística.
 * Separador: ponto e vírgula (locale PT/Excel).
 */
export function buildSimulationMemoryCsv(
  simulation: SimulationResponse,
  focusYear: number,
  options?: {
    seriesEnriched?: boolean
    companyLabel?: string
    companyContext?: string
    memoryMeta?: MemoryExportMeta
  },
): string {
  const { seriesEnriched, companyLabel, companyContext, memoryMeta } = options ?? {}
  const parts: string[] = []
  const add = (row: string[]) => {
    parts.push(joinLine(row))
  }

  const series = simulation.transition_series ?? []
  const sorted = [...series].sort((a, b) => a.year - b.year)
  const focusPoint = sorted.find((p) => p.year === focusYear)

  add([
    "Documento",
    "Memória de cálculo determinística — export CSV (motor Go)",
  ])
  add(["Gerado em (UTC)", new Date().toISOString()])

  if (memoryMeta?.sessionCreatedAt) {
    add([
      "Sessão de resultado (registo interno)",
      memoryMeta.sessionCreatedAt,
    ])
  }
  if (memoryMeta?.recordId) {
    add(["ID de registo persistido", memoryMeta.recordId])
  }
  add([
    "Empresa / rótulo de sessão",
    companyLabel?.trim() || "—",
  ])
  add([
    "Contexto da empresa (texto)",
    companyContext?.trim() || "—",
  ])
  add([
    "Regime tributário (simulador)",
    simulation.company_regime?.trim() || "—",
  ])
  add(["Ano base da simulação (execução)", String(simulation.year)])
  add(["Ano de foco (export e painel)", String(focusYear)])
  if (simulation.overlap_model) {
    add([
      "Modelo de convivência / overlap (motor)",
      simulation.overlap_model,
    ])
  }
  if (simulation.revenue_total != null && String(simulation.revenue_total).trim() !== "") {
    add(["Receita total (soma serviços)", String(simulation.revenue_total)])
  }
  add([
    "transition_series_enriched (histórico reconstituído no GET)",
    seriesEnriched === true ? "sim" : "não",
  ])
  if (seriesEnriched === true) {
    add([
      "Aviso técnico",
      "Este registo foi reconstituído no servidor: líquidos e fatores de referência. O breakdown completo de bruto e créditos por ano fica no snapshot após executar e guardar uma nova simulação (POST do motor Go).",
    ])
  }
  if (simulation.transition_series_enriched != null) {
    add([
      "Flag API transition_series_enriched",
      String(simulation.transition_series_enriched),
    ])
  }
  add([])
  add([
    "Secção",
    "Série temporal (transition_series) — um ano por linha; valores em formato API",
  ])
  if (sorted.length === 0) {
    add([
      "—",
      "Sem transition_series neste snapshot. Consulte a secção de resumo agregado abaixo ou execute uma nova simulação.",
    ])
  } else {
    add([
      "Ano",
      "Carga legado líquida (old_tax_net)",
      "Carga CBS/IBS líquida (new_tax_net)",
      "Total líquido (total_tax_net)",
      "Delta (destino − legado)",
      "Delta %",
      "Fator PIS/COFINS (ref.)",
      "CBS (ref.)",
      "IBS (ref.)",
      "CBS+IBS combinado (ref.)",
      "Factor ISS municipal",
      "Modelo ISS",
    ])
    for (const p of sorted) {
      const f = p.factors
      add([
        String(p.year),
        safe(p.old_tax_net),
        safe(p.new_tax_net),
        safe(p.total_tax_net),
        p.delta != null ? safe(p.delta) : "—",
        p.delta_pct != null ? safe(p.delta_pct) : "—",
        f ? safe(f.pis_cofins_factor) : "—",
        f ? safe(f.cbs_rate) : "—",
        f ? safe(f.ibs_rate) : "—",
        f && f.combined_projected_rate
          ? safe(f.combined_projected_rate)
          : "—",
        f && f.iss_municipal_factor != null
          ? safe(f.iss_municipal_factor)
          : "—",
        f && f.iss_model ? safe(f.iss_model) : "—",
      ])
    }
  }
  add([])
  add([
    "Secção",
    `Detalhe do ano de foco (${String(focusYear)}) — breakdown e fatores regulamentares`,
  ])
  if (!focusPoint) {
    add([
      "—",
      `Não existe ponto em transition_series para o ano ${String(focusYear)} neste snapshot.`,
    ])
  } else {
    const fp = focusPoint
    add(["Campo (ponto do ano de foco)", "Valor (API)"])
    add(["old_tax_net", safe(fp.old_tax_net)])
    add(["new_tax_net", safe(fp.new_tax_net)])
    add(["total_tax_net", safe(fp.total_tax_net)])
    if (fp.delta != null) add(["delta", safe(fp.delta)])
    if (fp.delta_pct != null) add(["delta_pct", safe(fp.delta_pct)])
    add([])
    add([
      "Subsecção",
      "Blocos current / projected (ano de foco)",
    ])
    add([
      "Bloco",
      "gross_tax",
      "credits",
      "net_tax",
    ])
    if (fp.current) {
      add([
        "current (legado PIS/COFINS/ISS no modelo)",
        safe(fp.current.gross_tax),
        safe(fp.current.credits),
        safe(fp.current.net_tax),
      ])
    } else {
      add(["current", "—", "—", "—"])
    }
    if (fp.projected) {
      add([
        "projected (destino CBS/IBS no modelo)",
        safe(fp.projected.gross_tax),
        safe(fp.projected.credits),
        safe(fp.projected.net_tax),
      ])
    } else {
      add(["projected", "—", "—", "—"])
    }
    const ff = fp.factors
    add([])
    add([
      "Subsecção",
      `Parâmetros TransitionYearFactors — ano ${String(focusYear)}`,
    ])
    if (ff) {
      add(["Parâmetro", "Valor"])
      add(["year (factors)", String(ff.year)])
      add(["pis_cofins_factor", safe(ff.pis_cofins_factor)])
      add(["cbs_rate", safe(ff.cbs_rate)])
      add(["ibs_rate", safe(ff.ibs_rate)])
      if (ff.combined_projected_rate) {
        add(["combined_projected_rate", safe(ff.combined_projected_rate)])
      }
      if (ff.iss_municipal_factor != null) {
        add(["iss_municipal_factor", safe(ff.iss_municipal_factor)])
      }
      if (ff.iss_model) {
        add(["iss_model", safe(ff.iss_model)])
      }
    } else {
      add([
        "—",
        "Sem fatores (TransitionYearFactors) para este ponto no snapshot actual.",
      ])
    }
  }
  add([])
  add([
    "Secção",
    "Resumo agregado (payload principal da resposta; ano " + String(simulation.year) + ")",
  ])
  add([
    "current (agregado).gross_tax / credits / net_tax",
    safe(simulation.current.gross_tax),
    safe(simulation.current.credits),
    safe(simulation.current.net_tax),
  ])
  add([
    "projected (agregado).gross_tax / credits / net_tax",
    safe(simulation.projected.gross_tax),
    safe(simulation.projected.credits),
    safe(simulation.projected.net_tax),
  ])
  add(["delta (agregado)", safe(simulation.delta)])
  add(["delta_pct (agregado)", safe(simulation.delta_pct)])

  return UTF8_BOM + parts.join("")
}

/**
 * Gera o CSV e inicia a transferência no browser (Blob text/csv).
 */
export function downloadSimulationMemoryCsv(
  simulation: SimulationResponse,
  focusYear: number,
  options?: {
    seriesEnriched?: boolean
    companyLabel?: string
    companyContext?: string
    memoryMeta?: MemoryExportMeta
  },
): void {
  const text = buildSimulationMemoryCsv(simulation, focusYear, options)
  const filename = `tribia-memoria-calculo-${String(focusYear)}-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/gu, "-")}.csv`
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  a.click()
  URL.revokeObjectURL(url)
}
