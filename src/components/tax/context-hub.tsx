"use client"

import { CalendarDays, Landmark, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import { Button } from "@/components/ui/button"
import { CompanyRegimeSelect } from "@/components/tax/company-regime-select"
import { StrategyChips } from "@/components/tax/strategy-chips"
import { useStrategyTags } from "@/hooks/use-strategy-tags"

export function ContextHub() {
  const { year, companyContext, companyRegime, setYear, setCompanyContext, setCompanyRegime } =
    useTaxStore()
  const { tags } = useStrategyTags()
  const strategyTagsDiscoveryMessage = useTaxStore((s) => s.strategyTagsDiscoveryMessage)
  const strategyTagHighlightPatterns = useTaxStore((s) => s.strategyTagHighlightPatterns)
  const clearStrategyTagsDiscoveryUi = useTaxStore((s) => s.clearStrategyTagsDiscoveryUi)

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "p-4 sm:p-5 transition-shadow",
        "focus-within:shadow-[0_8px_36px_rgb(16,185,129,0.12)] focus-within:border-emerald-200/50",
        "dark:border-border/60 dark:bg-card/80",
      )}
    >
      <div className="flex flex-wrap items-start gap-4 lg:gap-6">
        <div className="flex min-w-[140px] flex-1 flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            <Label
              htmlFor="year"
              className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              Ano de transição
            </Label>
          </div>
          <Input
            id="year"
            type="number"
            min={2026}
            max={2033}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 tabular-nums"
          />
          <p className="text-[10px] text-muted-foreground">2026–2033 · cronograma da reforma</p>
        </div>

        <div className="min-w-[min(100%,220px)] flex-[1.2]">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Landmark className="size-3.5 shrink-0" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-widest">Regime</span>
            <Badge variant="secondary" className="ml-auto text-[9px] font-normal px-1.5 py-0">
              LC 68/2024
            </Badge>
          </div>
          <CompanyRegimeSelect
            showLabel={false}
            value={companyRegime}
            onChange={setCompanyRegime}
            className="space-y-0"
            selectClassName="dark:bg-background"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-accent shrink-0" aria-hidden />
          <Label htmlFor="context" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Contexto da empresa
            <span className="ml-1 normal-case tracking-normal text-accent">(IA classifica créditos)</span>
          </Label>
        </div>
        <textarea
          id="context"
          placeholder="ex.: empresa SaaS, regime regular IBS/CBS…"
          value={companyContext ?? ""}
          onChange={(e) => setCompanyContext(e.target.value)}
          rows={3}
          className={cn(
            "min-h-[72px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "dark:bg-input/30",
          )}
        />
        {strategyTagsDiscoveryMessage && (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-lg border border-emerald-500/35 bg-emerald-50/90 px-3 py-2.5 text-xs text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-50"
          >
            <p className="leading-snug pr-6">{strategyTagsDiscoveryMessage}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 self-start border-emerald-600/40 text-[10px] dark:border-emerald-400/40"
              onClick={() => clearStrategyTagsDiscoveryUi()}
            >
              Fechar
            </Button>
          </div>
        )}
        <StrategyChips
          text={companyContext ?? ""}
          tags={tags}
          highlightPatterns={strategyTagHighlightPatterns}
        />
      </div>
    </div>
  )
}
