"use client"

import { BoardAuditCertificate } from "@/components/tax/board-audit-certificate"
import { BoardLegalCoverageShield } from "@/components/tax/board-legal-coverage-shield"
import { confidenceTierFromScore01, humanSolidityHintFromAggregatedScore01 } from "@/lib/confidence-tiers"
import { avgEvidenceCountAmongLinesWithEvidence, countTenuousNexusLines } from "../lib/rag-tab-stats"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function CoberturaLegalAuditoriaSection({ record }: ReportSectionProps) {
  const { aiMetadata, classifications } = record
  const score = aiMetadata?.confidence_score
  const tier = score != null && Number.isFinite(score) ? confidenceTierFromScore01(score) : null
  const breakdown = aiMetadata?.breakdown
  const coveragePct =
    breakdown && Number.isFinite(breakdown.evidence_coverage)
      ? Math.round(Math.min(1, Math.max(0, breakdown.evidence_coverage)) * 100)
      : null
  const literalPct =
    breakdown && Number.isFinite(breakdown.llm_confidence_mean)
      ? Math.round(Math.min(1, Math.max(0, breakdown.llm_confidence_mean)) * 100)
      : null
  const solidityHint =
    score != null && Number.isFinite(score) ? humanSolidityHintFromAggregatedScore01(score) : null
  const withEvidenceCount = breakdown?.with_evidence_count ?? 0
  const classifiedCount = breakdown?.classified_count ?? classifications.length
  const avgEvPerLine = avgEvidenceCountAmongLinesWithEvidence(classifications)
  const tenuousLineCount = countTenuousNexusLines(classifications)

  return (
    <div className="space-y-5">
      {tier != null && (
        <BoardLegalCoverageShield
          coveragePct={coveragePct}
          withEvidence={withEvidenceCount}
          total={Math.max(1, classifiedCount)}
          tier={tier}
          score={score}
          solidityHint={solidityHint}
        />
      )}
      <BoardAuditCertificate
        literalPct={literalPct}
        avgEvPerLine={avgEvPerLine}
        tenuousLineCount={tenuousLineCount}
      />
    </div>
  )
}

export const coberturaLegalAuditoriaSection: ReportSection = {
  id: "cobertura-legal-auditoria",
  title: "Cobertura legal e certificado de auditoria",
  capability: "boardReadyUnlocked",
  print: "always",
  screenTab: "dossie",
  Component: CoberturaLegalAuditoriaSection,
}
