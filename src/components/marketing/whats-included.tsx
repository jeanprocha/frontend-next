import { Check, Info } from "lucide-react"

/**
 * Seção 07 — âncora `#planos` (linkada de dentro do produto por
 * BoardReadyTeaseSheet → "Ver planos Pro"). Substitui a antiga seção de
 * preços por uma tabela de capacidades: sem preço, sem CTA de compra
 * (docs/product/04-landing.md §1 — decisão "Virar 'o que está incluído'").
 *
 * Cotas e capabilities espelham internal/plg/plg.go (defaults: 3
 * simulações/dia e 3 empresas no Free; 30 empresas no Pro) e
 * features/plg/capabilities.ts (getPlgCapabilities) — não valores
 * inventados. A cédula de auditoria (citação + trecho) é comum aos três
 * tiers; só o realce do trecho (rayxFull) é exclusivo de Pro/Premium.
 */

type CellValue = boolean | string

interface Row {
  label: string
  free: CellValue
  pro: CellValue
  premium: CellValue
}

const ROWS: Row[] = [
  { label: "Classificação de despesas com evidência por linha", free: true, pro: true, premium: true },
  { label: "Cédula de auditoria: citação, trecho da lei e similaridade", free: true, pro: true, premium: true },
  { label: "Raio-X completo — realce do trecho e evidências sem borrão", free: false, pro: true, premium: true },
  { label: "Simulações por dia", free: "3", pro: "sem limite", premium: "sem limite" },
  { label: "Clientes na carteira", free: "3", pro: "30", premium: "sem limite" },
  { label: "Dossiê público compartilhável", free: false, pro: true, premium: true },
  { label: "Memória de cálculo e fatores do ano", free: false, pro: true, premium: true },
  { label: "Série completa 2026–2033 e comparação A/B", free: false, pro: true, premium: true },
  { label: "Abertura do PDF oficial na página ancorada", free: false, pro: true, premium: true },
  { label: "Marca do escritório no dossiê", free: false, pro: false, premium: true },
]

function Cell({ value }: { value: CellValue }) {
  if (typeof value === "string") {
    return <span className="font-mono text-sm text-foreground tabular-nums">{value}</span>
  }
  if (value) {
    return <Check className="mx-auto size-4 text-accent" aria-label="Incluído" />
  }
  return (
    <span className="text-muted-foreground/50" aria-label="Não incluído">
      —
    </span>
  )
}

export function WhatsIncluded() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-14">
      <div className="rounded-xl border border-border bg-card p-6 tribia-shadow-elevated sm:p-8">
        <div className="flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-xs font-medium tracking-[0.12em] text-accent uppercase">07 · Acesso</span>
            <h2 className="font-board-report mt-1.5 text-[28px] leading-tight font-semibold tracking-tight text-foreground">
              O que está incluído
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground sm:text-right">
            Sem preço definido — o produto está em demonstração pública.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                <th className="py-3" />
                {(["Free", "Pro", "Premium"] as const).map((tier) => (
                  <th
                    key={tier}
                    className="w-[110px] py-3 text-center font-mono text-xs font-medium tracking-wide text-foreground uppercase"
                  >
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="py-3 pr-4 text-[15px] text-foreground">{row.label}</td>
                  <td className="py-3 text-center">
                    <Cell value={row.free} />
                  </td>
                  <td className="py-3 text-center">
                    <Cell value={row.pro} />
                  </td>
                  <td className="py-3 text-center">
                    <Cell value={row.premium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">
            O dossiê que chega ao seu cliente abre completo — memória de cálculo, série 2026–2033 e plano de ação —
            qualquer que seja o plano de quem o gerou; a tabela acima é sobre o que você vê enquanto trabalha. Entrar
            exige acesso: o simulador não está aberto ao público nesta fase, e o dossiê de exemplo abre sem login.
          </p>
        </div>
      </div>
    </section>
  )
}
