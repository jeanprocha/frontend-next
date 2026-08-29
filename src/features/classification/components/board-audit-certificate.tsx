"use client"

import { AlertTriangle, CheckCircle2, FileCheck, Layers2, ShieldCheck } from "lucide-react"
import { formatDecimalPtBR } from "@/lib/format-money"
import { confidenceTierShortLabel } from "@/lib/confidence-tiers"
import type { ConfidenceTier } from "@/lib/confidence-tiers"
import { cn } from "@/lib/utils"

export interface BoardAuditCertificateProps {
  literalPct: number | null
  avgEvPerLine: number | null
  tenuousLineCount: number
  /** Item A3 — antes card próprio com escudo ~130px; agora linha discreta neste bloco. */
  coveragePct: number | null
  withEvidence: number
  total: number
  tier: ConfidenceTier | null
  score: number | null | undefined
  solidityHint: string | null
  className?: string
}

/**
 * Certificado de auditoria digital — quatro pilares (board) sem jargão RAG na linha de frente.
 */
export function BoardAuditCertificate({
  literalPct,
  avgEvPerLine,
  tenuousLineCount,
  coveragePct,
  withEvidence,
  total,
  tier,
  score,
  solidityHint,
  className,
}: BoardAuditCertificateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/80 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:bg-card/40",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Certificado de auditoria digital
      </p>
      <ul className="mt-2.5 space-y-3">
        <li className="flex gap-2.5">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium leading-snug text-foreground">Cobertura legal</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {coveragePct != null ? `${coveragePct}%` : "—"}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Fundamentos encontrados para {withEvidence} das {total} despesas processadas neste simulador
              {tier && score != null && Number.isFinite(score) ? ` · ${confidenceTierShortLabel(tier)}` : ""}.
            </p>
            {solidityHint ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">{solidityHint}</p>
            ) : null}
          </div>
        </li>
        <li className="flex gap-2.5">
          <FileCheck
            className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium leading-snug text-foreground">Aderência textual</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {literalPct != null ? `${literalPct}%` : "—"}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Grau de correspondência entre o dado do cliente e o dispositivo aplicável na legislação vigente.
            </p>
          </div>
        </li>
        <li className="flex gap-2.5">
          <Layers2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium leading-snug text-foreground">Triangulação de provas</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {avgEvPerLine != null ? formatDecimalPtBR(avgEvPerLine) : "—"}{" "}
              <span className="font-sans text-[11px] font-normal text-muted-foreground">
                trechos em média por linha com evidência
              </span>
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Cada classificação é corroborada por várias recuperações distintas da legislação, reforçando a solidez da
              interpretação.
            </p>
          </div>
        </li>
        <li className="flex gap-2.5">
          {tenuousLineCount > 0 ? (
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
          )}
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium leading-snug text-foreground">Segurança interpretativa</p>
            {/* "0" cru lia-se "segurança zero" (achado do critique) — o valor
                zero é a melhor notícia deste bloco, então vira frase positiva
                em vez de dígito ambíguo; N > 0 nomeia o que precisa revisão. */}
            <p className="text-sm font-semibold text-foreground">
              {tenuousLineCount === 0
                ? "Nenhum nexo tênue detectado"
                : `${tenuousLineCount} ${tenuousLineCount === 1 ? "nexo tênue" : "nexos tênues"} para revisar`}
            </p>
            {tenuousLineCount === 0 ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Sem analogias forçadas entre a despesa e o dispositivo — leitura conservadora para auditoria.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Revise essas linhas na Classificação IA antes de fechar o parecer.
              </p>
            )}
          </div>
        </li>
      </ul>
    </div>
  )
}
