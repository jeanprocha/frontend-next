"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Landmark, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import { Button } from "@/components/ui/button"
import {
  CompanyRegimeSelect,
  RegimeProfileHelp,
} from "./company-regime-select"
import { StrategyChips } from "./strategy-chips"
import { ContextHighlightField } from "./context-highlight-field"
import { useStrategyTags } from "../hooks/use-strategy-tags"
import { useCapability, PlgUpgradeDialog } from "@/features/plg"
import { useLawCorpus } from "@/lib/use-law-corpus"

export function ContextHub() {
  const { year, companyContext, companyRegime, setYear, setCompanyContext, setCompanyRegime } =
    useTaxStore()
  const { tags } = useStrategyTags()
  const strategyTagsDiscoveryMessage = useTaxStore((s) => s.strategyTagsDiscoveryMessage)
  const strategyTagHighlightPatterns = useTaxStore((s) => s.strategyTagHighlightPatterns)
  const clearStrategyTagsDiscoveryUi = useTaxStore((s) => s.clearStrategyTagsDiscoveryUi)
  const contextHighlightRuneRange = useTaxStore((s) => s.contextHighlightRuneRange)
  const analystBriefingOpen = useTaxStore((s) => s.analystBriefingOpen)
  const analystBriefingKind = useTaxStore((s) => s.analystBriefingKind)
  const fullRayx = useCapability("rayxFull")
  const [rayxUpgradeOpen, setRayxUpgradeOpen] = useState(false)
  const { changelog } = useLawCorpus()

  const hasAnchorSpan =
    contextHighlightRuneRange != null &&
    contextHighlightRuneRange.end > contextHighlightRuneRange.start

  const showRayxCallout = useMemo(
    () =>
      analystBriefingOpen &&
      analystBriefingKind !== null &&
      analystBriefingKind !== "macro",
    [analystBriefingOpen, analystBriefingKind],
  )

  const rayxCalloutMode = useMemo(() => {
    if (!showRayxCallout) return null
    if (hasAnchorSpan) return fullRayx ? "full" : "tease"
    return "missing"
  }, [showRayxCallout, hasAnchorSpan, fullRayx])

  return (
    <>
      <PlgUpgradeDialog
        open={rayxUpgradeOpen}
        onOpenChange={setRayxUpgradeOpen}
        feature="rayx"
      />
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-white/80 backdrop-blur-md tribia-shadow-elevated",
        "p-4 sm:p-5 transition-shadow",
        "tribia-shadow-context-focus focus-within:border-accent/50",
        "dark:border-border/60 dark:bg-card/80",
      )}
    >
      <div className="flex flex-wrap items-start gap-4 lg:gap-6">
        <div className="flex min-w-[140px] flex-1 flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            <Label
              htmlFor="year"
              className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
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
          <p className="text-xs text-muted-foreground">2026–2033 · cronograma da reforma</p>
        </div>

        <div className="flex min-w-[min(100%,220px)] flex-[1.2] flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Landmark className="size-3.5 shrink-0" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-widest">Regime</span>
            <Badge variant="secondary" className="ml-auto shrink-0 text-xs font-normal px-1.5 py-0">
              {changelog.label}
            </Badge>
            <RegimeProfileHelp />
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
          <Label htmlFor="context" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Contexto da empresa
            <span className="ml-1 normal-case tracking-normal text-accent">(IA classifica créditos)</span>
          </Label>
        </div>
        {showRayxCallout && rayxCalloutMode != null && (
          <div
            id="ray-x-anchor-callout"
            role="status"
            className={cn(
              "rounded-lg border px-3 py-2 text-xs leading-snug",
              rayxCalloutMode === "full" &&
                "border-emerald-500/30 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-950/25 dark:text-emerald-50",
              rayxCalloutMode === "tease" &&
                "border-border/80 bg-muted/40 text-foreground/90 dark:bg-muted/25",
              rayxCalloutMode === "missing" &&
                "border-amber-500/35 bg-amber-50/80 text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-50",
            )}
          >
            {rayxCalloutMode === "full" && (
              <p>
                Trecho do contexto que sustenta esta instância está{" "}
                <span className="font-medium text-foreground">realçado abaixo</span>.
              </p>
            )}
            {rayxCalloutMode === "tease" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="min-w-0 flex-1">
                  O sistema identificou o trecho correspondente; no Pro o realce fica nítido no contexto e o briefing reúne a trilha completa na {changelog.label} com evidências RAG.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 shrink-0 text-sm"
                  onClick={() => setRayxUpgradeOpen(true)}
                >
                  Saiba mais
                </Button>
              </div>
            )}
            {rayxCalloutMode === "missing" && (
              <p>
                Não foi possível localizar no texto atual um trecho único para esta etiqueta ou instância — confira o racional técnico no briefing lateral.
              </p>
            )}
          </div>
        )}
        <ContextHighlightField
          id="context"
          placeholder="ex.: empresa SaaS, regime regular IBS/CBS…"
          value={companyContext ?? ""}
          onChange={setCompanyContext}
          rows={3}
          highlightRuneRange={contextHighlightRuneRange}
          teaseRayxHighlight={!fullRayx}
          ariaDescribedBy={showRayxCallout ? "ray-x-anchor-callout" : undefined}
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
              className="h-7 self-start border-emerald-600/40 text-xs dark:border-emerald-400/40"
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
          describedById="strategy-chips-explainer"
        />
        <p
          id="strategy-chips-explainer"
          className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground"
        >
          As etiquetas ligam o que escreve a um{" "}
          <span className="font-medium text-foreground/80">vocabulário fiscal</span> sincronizado com o servidor. O destaque (ícone ou anel) marca padrões integrados nesta sessão após a última simulação. A telemetria de produto registra apenas identificadores taxonômicos — nunca o texto livre do contexto.
        </p>
      </div>
    </div>
    </>
  )
}
