import { BarChart2, Share2, Sparkles, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

const etapas = [
  {
    n: 1,
    short: "Input",
    title: "Insira seus dados (CSV, form)",
    body: "Entrada descomplicada: formulário guiado ou lote em CSV, sem fricção operacional. Ideal para o time financeiro reutilizar a mesma base em vários cenários.",
    icon: Upload,
  },
  {
    n: 2,
    short: "RAG / Lei",
    title: "IA RAG rastreia a base legal",
    body: "Cada conclusão é ancorada em trechos recuperados da legislação — com justificativa e redução de alucinação. Transparência que aguenta a mesa de governança.",
    icon: Sparkles,
  },
  {
    n: 3,
    short: "Cálculo",
    title: "Motor Go calcula com rigor",
    body: "Carga líquida determinística, série de transição e deltas reproduzíveis. A mesma entrada produz a mesma saída, em tempo de produto, não de planilheiro.",
    icon: BarChart2,
  },
  {
    n: 4,
    short: "Entrega",
    title: "Dossiê digital compartilhável",
    body: "Gere um dossié linear, link público para o conselho ou exportação com tipografia e selo de auditoria — incluindo “Auditado via RAG Engine” e PDF com acabamento Board-Ready quando aplicável.",
    icon: Share2,
  },
] as const

/**
 * Processo claro, vertical com linha de ligação; em desktop, alternância legível.
 */
export function ProductFlowLinear() {
  return (
    <section id="como-funciona" className="border-b bg-muted/30 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Fluxo
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Do dado à decisão
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Um percurso linear do input ao dossié — alinhado ao processo de fechamento e apresentação.
          </p>
        </div>

        <ol className="relative">
          {etapas.map((step, i) => (
            <li
              key={step.n}
              className={cn(
                "relative flex gap-4 pb-10 sm:pb-12",
                "before:absolute before:left-[15px] before:top-9 before:bottom-0 before:w-px before:bg-border/70 last:before:hidden",
                i === etapas.length - 1 && "pb-0",
              )}
            >
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600/40 bg-background text-center font-mono text-xs font-bold text-emerald-600">
                {step.n}
              </div>
              <div
                className={cn(
                  "min-w-0 flex-1",
                  i < etapas.length - 1 && "border-b border-border/50 pb-8 sm:pb-10",
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10">
                    <step.icon className="h-4 w-4 text-emerald-600" aria-hidden />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {step.short}
                  </span>
                </div>
                <h3 className="font-board-report text-lg font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="font-board-report tribia-print-narrative-serif mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
