"use client"

import { useCallback, useEffect, useState } from "react"
import { CapabilityProvider, PUBLIC_REPORT_CAPABILITIES } from "@/features/plg"
import { Button } from "@/components/ui/button"
import { getPublicSimulationRecord } from "@/lib/api"
import { simulationDetailToRecord } from "@/lib/history-hydrate"
import { deriveSessionCompanyLabel } from "@/lib/session-labels"
import { cn } from "@/lib/utils"
import { ReportRenderer } from "./report-renderer"
import type { ReportSection, SimulationRecord } from "@/lib/report-contract"

const REPORT_PDF_FAB = "report-export-pdf-fab no-print print:hidden"

interface PublicReportProps {
  id: string
  /**
   * Lista de seções, composta por app/report/[id]/page.tsx a partir de
   * features/report + features/classification — report ↛ classification
   * (só features/plg tem exceção no lint de fronteira).
   */
  sections: ReportSection[]
}

export function PublicReport({ id, sections }: PublicReportProps) {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [record, setRecord] = useState<SimulationRecord | null>(null)
  const [focusYear, setFocusYear] = useState(2026)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- herança FE-0: dívida pré-existente (regra nova do eslint-config-next 16.2.2); resolver ao tocar este arquivo
    setLoading(true)
    setErr(null)
    getPublicSimulationRecord(id)
      .then((d) => {
        if (cancelled) return
        setRecord(simulationDetailToRecord(d))
        setFocusYear(d.simulation.year)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : "Não foi possível carregar o dossiê.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print()
  }, [])

  if (loading) {
    return (
      <div
        className="font-board-report tribia-print-narrative-serif min-h-screen bg-background p-8 text-foreground"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-muted-foreground">Carregando o dossiê…</p>
      </div>
    )
  }

  if (err || !record) {
    return (
      <div className="font-board-report min-h-screen bg-background p-8">
        <p className="text-destructive text-sm" role="alert">
          {err ?? "Dossiê indisponível."}
        </p>
      </div>
    )
  }

  const sessionCompanyLabel = deriveSessionCompanyLabel(record.meta?.companyContext)

  return (
    <CapabilityProvider value={PUBLIC_REPORT_CAPABILITIES}>
      <div
        className={cn(
          "board-ready font-board-report tribia-print-narrative-serif min-h-screen bg-white text-foreground",
          "print:min-h-0 print:bg-white",
        )}
      >
        <header
          className={cn(
            "print:hidden sticky top-0 z-40 border-b border-border/60 bg-white/95 backdrop-blur",
            "supports-[backdrop-filter]:bg-white/90",
          )}
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {record.reportBrand?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.reportBrand.logo_url}
                  alt={record.reportBrand.org_name || "Logotipo do cliente"}
                  className="h-8 w-auto max-w-[140px] object-contain object-left"
                />
              ) : null}
              <div className="min-w-0 text-right sm:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Auditado via RAG Engine
                </p>
                {record.reportBrand?.org_name ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{record.reportBrand.org_name}</p>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="default"
              className={cn("shrink-0 bg-emerald-700 hover:bg-emerald-800", REPORT_PDF_FAB)}
              data-report-pdf-fab
              onClick={handlePrint}
            >
              Exportar para PDF
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 print:space-y-6 print:py-4">
          <p className="text-center text-xs text-muted-foreground print:text-foreground/80">
            Relatório linear · referência pública
            {record.meta?.recordId ? ` · ${record.meta.recordId.slice(0, 8)}…` : ""}
          </p>

          <h1 className="sr-only">Veredito financeiro — dossiê TribIA</h1>

          <ReportRenderer
            record={record}
            sections={sections}
            mode="public-linear"
            focusYear={focusYear}
            onFocusYearChange={setFocusYear}
            sessionCompanyLabel={sessionCompanyLabel}
          />
        </div>
      </div>
    </CapabilityProvider>
  )
}
