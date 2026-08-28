import { describe, expect, it } from "vitest"
import { buildAuditCsv } from "./build-audit-csv"
import type { ClassificationItem, FormExpense } from "@/types/api"

const EXPENSES: FormExpense[] = [
  { id: "e1", description: "Infraestrutura em nuvem", amount: "4000.00" },
  { id: "e2", description: "Assinatura sem match", amount: "199.90" },
]

const CLASSIFICATIONS: ClassificationItem[] = [
  {
    client_id: "e1",
    description: "Infraestrutura em nuvem",
    is_eligible: true,
    confidence: 0.918,
    justification: "…",
    legal_base: "Art. 47, § 1º",
    risk_level: "baixo",
    regime_type: "padrao",
    evidence: [],
  },
]

describe("buildAuditCsv", () => {
  it("começa com BOM UTF-8 e usa ; como delimitador", () => {
    const csv = buildAuditCsv(EXPENSES, CLASSIFICATIONS)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const header = csv.slice(1).split("\r\n")[0]
    expect(header).toBe("Descrição;Valor (R$);Classificação da IA;Decisão efetiva;Confiança;Base legal")
  })

  it("uma linha por despesa, na mesma ordem, com valor no formato do produto", () => {
    const csv = buildAuditCsv(EXPENSES, CLASSIFICATIONS)
    const lines = csv.slice(1).trimEnd().split("\r\n")
    expect(lines).toHaveLength(3) // header + 2 despesas
    expect(lines[1]).toBe(
      "Infraestrutura em nuvem;R$ 4.000,00;Elegível · Padrão;Elegível · Padrão;92%;Art. 47, § 1º",
    )
  })

  it("despesa sem classificação correspondente não quebra e marca como tal", () => {
    const csv = buildAuditCsv(EXPENSES, CLASSIFICATIONS)
    const lines = csv.slice(1).trimEnd().split("\r\n")
    expect(lines[2]).toBe("Assinatura sem match;R$ 199,90;—;Sem classificação;—;—")
  })

  it("override do consultor aparece na decisão efetiva, nunca na sugestão da IA", () => {
    const withOverride: ClassificationItem[] = [
      {
        ...CLASSIFICATIONS[0],
        is_eligible: false, // sugestão original da IA — nunca muda
        consultant_override: {
          is_eligible: true,
          regime_type: "padrao",
          overridden_at: "2026-08-28T10:00:00Z",
        },
      },
    ]
    const csv = buildAuditCsv([EXPENSES[0]], withOverride)
    const line = csv.slice(1).trimEnd().split("\r\n")[1]
    expect(line).toContain("Não elegível a crédito") // sugestão da IA intocada
    expect(line).toContain("Elegível · Padrão (curado pelo consultor)") // decisão efetiva
  })

  it('escapa campos com ";", aspas ou quebra de linha (RFC 4180)', () => {
    const expenses: FormExpense[] = [{ id: "e3", description: 'Serviço "premium"; anual', amount: "10.00" }]
    const csv = buildAuditCsv(expenses, [])
    const line = csv.slice(1).trimEnd().split("\r\n")[1]
    expect(line.startsWith('"Serviço ""premium""; anual";')).toBe(true)
  })
})
