"use client"

import { AlertTriangle, CheckCircle2, FileCheck, Layers2 } from "lucide-react"
import { formatDecimalPtBR } from "@/lib/format-money"
import { cn } from "@/lib/utils"

export interface BoardAuditCertificateProps {
  literalPct: number | null
  avgEvPerLine: number | null
  tenuousLineCount: number
  className?: string
}

/**
 * Certificado de auditoria digital — três pilares (board) sem jargão RAG na linha de frente.
 */
export function BoardAuditCertificate({
  literalPct,
  avgEvPerLine,
  tenuousLineCount,
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
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">{tenuousLineCount}</p>
            {tenuousLineCount === 0 ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Nenhuma detecção de nexo tênue: sem analogias forçadas entre a despesa e o dispositivo — leitura
                conservadora para auditoria.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {tenuousLineCount}{" "}
                {tenuousLineCount === 1 ? "linha com" : "linhas com"} nexo interpretativo tênue — rever na Classificação
                IA.
              </p>
            )}
          </div>
        </li>
      </ul>
    </div>
  )
}
