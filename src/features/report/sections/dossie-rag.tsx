"use client"

import { LawPdfAuthorityCard } from "@/components/tax/law-pdf-authority-card"
import { RagAuditCard } from "@/components/tax/rag-audit-card"
import { resolveHeroEvidencePick } from "@/lib/session-authority-evidence"
import { useTaxStore } from "@/store/useTaxStore"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function DossieRagSection({ record }: ReportSectionProps) {
  const openMacroBriefing = useTaxStore((s) => s.openAnalystBriefingFromMacro)
  const { aiMetadata, classifications, expenses } = record
  const heroPick = resolveHeroEvidencePick(classifications, expenses)

  return (
    <section
      id="tribia-dossie-auditoria"
      className="scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
    >
      <div className="p-5 sm:p-6 print:p-0">
        <div className="mb-4 flex items-center gap-2.5 print:mb-3">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden"
          >
            3
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground">
            Dossiê de Auditoria (RAG)
          </h2>
        </div>
        <div className="space-y-5">
          <RagAuditCard
            aiMetadata={aiMetadata}
            onOpenBriefing={aiMetadata ? () => openMacroBriefing(aiMetadata) : undefined}
          />
          {heroPick?.evidence.article_id ? (
            <LawPdfAuthorityCard
              chunkArticleId={heroPick.evidence.article_id}
              className="print:border-foreground/20"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

export const dossieRagSection: ReportSection = {
  id: "dossie-rag",
  title: "Dossiê de auditoria (RAG)",
  print: "always",
  screenTab: "dossie",
  Component: DossieRagSection,
}
