"use client"

import { useState } from "react"
import { FocusYearControl } from "./components/focus-year-control"
import {
  SIMULATION_RESULTS_ANCHORS,
  SimulationResultsStickyIndex,
  type SimulationResultsAnchorKey,
} from "./components/simulation-results-sticky-index"
import { SimulationSessionAuthorityStamp } from "./components/simulation-session-authority-stamp"
import { usePlgCapabilities } from "@/features/plg"
import { availableFocusYears } from "@/lib/transition-focus"
import { cn } from "@/lib/utils"
import type {
  ReportRenderInput,
  ReportScreenTab,
  ReportSection,
  ReportSectionProps,
} from "@/lib/report-contract"

const UNIFIED_DOSSIER_CARD_CLASS = cn(
  "overflow-hidden rounded-xl border border-border/80 bg-card/90 shadow-sm",
  "print:overflow-visible print:rounded-none print:border print:border-foreground/20 print:shadow-none print:bg-transparent",
)

function chromeMounts(section: ReportSection, mode: ReportRenderInput["mode"]): boolean {
  if (section.print === "board-only") return mode === "board"
  // print-only chrome (masthead/tabela/rodapé) monta sempre — CSS `hidden print:*` decide a visibilidade.
  return section.print === "print-only"
}

/**
 * Renderiza a lista de secções de um dossié. screen-tabs monta só a secção da
 * aba activa dentro do cartão unificado (chrome de sessão + índice sticky);
 * board/public-linear montam tudo, em sequência, sem esse cartão — cada
 * secção de conteúdo já traz a sua própria borda. Secções sem screenTab
 * (masthead/tabela/rodapé de impressão, watermark) são chrome: ficam sempre
 * fora do cartão, na ordem do registry.
 */
export function ReportRenderer({
  record,
  sections,
  mode,
  focusYear,
  onFocusYearChange,
  overrides,
  comparison,
  slots,
  sessionCompanyLabel,
  sessionScenarioLabel,
}: ReportRenderInput) {
  const [activeTab, setActiveTab] = useState<SimulationResultsAnchorKey>("veredito")
  const cap = usePlgCapabilities()

  // screen-tabs: trocar de aba já traz a secção ao topo — sem scroll extra.
  // board: tudo já está montado, um scroll directo basta. public-linear: sem navegação (dossié público não tem tabs).
  const onNavigateToTab =
    mode === "screen-tabs"
      ? setActiveTab
      : mode === "board"
        ? (tab: ReportScreenTab) => {
            if (typeof document === "undefined") return
            const targetId =
              tab === "dossie"
                ? "tribia-dossie-auditoria"
                : tab === "cronograma"
                  ? "tribia-journey-transicao"
                  : tab === "mesa"
                    ? "tribia-mesa-operacoes"
                    : "veredito-executivo"
            document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        : undefined

  const sectionProps: ReportSectionProps = {
    record,
    mode,
    focusYear,
    onFocusYearChange,
    overrides,
    comparison,
    sessionCompanyLabel,
    sessionScenarioLabel,
    onNavigateToTab,
  }

  const eligible = sections.filter((s) => !s.capability || cap[s.capability])
  const chrome = eligible.filter((s) => !s.screenTab && chromeMounts(s, mode))

  if (mode !== "screen-tabs") {
    // board / public-linear: tudo montado, na ordem do registry (chrome intercalado com conteúdo).
    const mounted = eligible.filter((s) => (s.screenTab ? true : chromeMounts(s, mode)))
    return (
      <>
        {/* D2 — controle canônico no topo do documento, junto à identidade;
            print:hidden nele mesmo (o ano de foco impresso vem do
            masthead/veredito, não deste controle). */}
        {onFocusYearChange && (
          <FocusYearControl
            years={availableFocusYears(record.simulation)}
            focusYear={focusYear}
            onFocusYearChange={onFocusYearChange}
            className="mb-4 justify-start"
          />
        )}
        {mounted.map((s) => (
          <s.Component key={s.id} {...sectionProps} />
        ))}
      </>
    )
  }

  const content = eligible.filter((s) => s.screenTab === activeTab)

  return (
    <>
      {chrome.map((s) => (
        <s.Component key={s.id} {...sectionProps} />
      ))}
      <div className={UNIFIED_DOSSIER_CARD_CLASS}>
        <div className="px-3 sm:px-4">
          <div
            className={cn(
              "flex min-w-0 flex-col gap-3 py-2.5 sm:gap-4 sm:py-3",
              slots?.sessionStampAside && "sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <SimulationSessionAuthorityStamp
                sessionCompanyLabel={sessionCompanyLabel ?? ""}
                sessionScenarioLabel={sessionScenarioLabel ?? ""}
                className="min-w-0 py-0"
              />
              {/* D2 — controle canônico junto ao carimbo de sessão/índice sticky. */}
              {onFocusYearChange && (
                <FocusYearControl
                  years={availableFocusYears(record.simulation)}
                  focusYear={focusYear}
                  onFocusYearChange={onFocusYearChange}
                  className="shrink-0"
                />
              )}
              {slots?.dossierCta ? <div className="shrink-0 sm:ml-auto">{slots.dossierCta}</div> : null}
            </div>
            {slots?.sessionStampAside ? (
              <div className="w-full min-w-0 sm:w-auto sm:max-w-[min(100%,28rem)] sm:shrink sm:pl-2">
                {slots.sessionStampAside}
              </div>
            ) : null}
          </div>
        </div>
        <SimulationResultsStickyIndex
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />
        {content.map((s) => (
          <s.Component key={s.id} {...sectionProps} />
        ))}
      </div>
    </>
  )
}

export { SIMULATION_RESULTS_ANCHORS }
