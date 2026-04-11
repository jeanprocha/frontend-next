"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useTribiaPlanContext } from "@/components/tribia/tribia-plan-provider"
import { usePdfLegislationProAccess } from "@/hooks/use-tribia-plg-tier"
import { cn } from "@/lib/utils"
import { fetchLawPdfAnchor } from "@/lib/api"
import { formatArticleLabel } from "@/lib/rag-metadata"
import { LawPdfOpenButton } from "@/components/tax/law-pdf-open-button"
import type { LawPdfAnchorResponse } from "@/types/api"

interface LawPdfAuthorityCardProps {
  chunkArticleId: string
  className?: string
  /**
   * Dentro de outro cartão (ex.: Artigo herói): sem segundo título de secção nem caixa esmeralda separada.
   */
  variant?: "default" | "embedded"
  /**
   * Quando o botão de abrir PDF está noutro sítio (ex.: junto ao trecho destacado).
   */
  hidePdfButton?: boolean
  /** Rótulo curto acima do parágrafo (ex.: «Cadeia de custódia» na tab Artigo herói). */
  eyebrow?: string
}

/**
 * Card de autoridade: prefetch da ancoragem PDF (Pro) para exibir página e versão antes do clique;
 * deep link para o PDF oficial. Free: copy de upgrade.
 */
export function LawPdfAuthorityCard({
  chunkArticleId,
  className,
  variant = "default",
  hidePdfButton = false,
  eyebrow,
}: LawPdfAuthorityCardProps) {
  const embedded = variant === "embedded"
  const pro = usePdfLegislationProAccess()
  const { tier } = useTribiaPlanContext()
  const { getToken, userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<LawPdfAnchorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pro || !chunkArticleId.trim()) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const token = await getToken()
        if (!token || !userId) {
          if (!cancelled) setError(null)
          return
        }
        const res = await fetchLawPdfAnchor(chunkArticleId, token, userId, tier)
        if (!cancelled) setData(res)
      } catch (e: unknown) {
        if (!cancelled) {
          setData(null)
          setError(e instanceof Error ? e.message : "Não foi possível obter a ancoragem.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chunkArticleId, pro, getToken, userId, tier])

  const articleLabel = formatArticleLabel(chunkArticleId)

  if (!pro) {
    return (
      <div
        className={cn(
          embedded
            ? "mt-3 border-t border-border/60 pt-3"
            : "rounded-lg border border-slate-200/70 bg-slate-50/40 p-3 dark:border-slate-800/50 dark:bg-slate-900/25",
          className,
        )}
      >
        {!embedded ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Texto oficial (PDF)
          </p>
        ) : null}
        {embedded && eyebrow?.trim() ? (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {eyebrow.trim()}
          </p>
        ) : null}
        <p className={cn("text-xs leading-relaxed text-muted-foreground", !embedded && "mt-2")}>
          A abertura directa no PDF do Diário Oficial na página indexada é recurso{" "}
          <span className="font-medium text-foreground/90">Pro</span>. O motor continua a ser a fonte determinística dos
          números; a IA fundamenta a leitura.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        embedded
          ? "mt-3 border-t border-border/60 pt-3"
          : "rounded-lg border border-emerald-200/60 bg-emerald-50/30 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/25",
        className,
      )}
    >
      {!embedded ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Prova no documento oficial
        </p>
      ) : null}
      {embedded && eyebrow?.trim() ? (
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow.trim()}</p>
      ) : null}
      {loading ? (
        <p className="mt-2 text-xs text-muted-foreground">A carregar ancoragem do PDF…</p>
      ) : error && !data ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {(() => {
            const label = articleLabel || "Dispositivo indexado"
            const versionRef = data?.lei_version?.trim() || data?.prf_file?.trim()
            const suffix = versionRef ? `(LC 68/2024 · ${versionRef})` : "(LC 68/2024)"
            if (data?.page != null) {
              return (
                <>
                  Este cenário baseia-se em {label}, com ancoragem na página{" "}
                  <span className="font-mono tabular-nums">{data.page}</span> do PDF oficial do Diário da União {suffix}{" "}
                  — prova documental alinhada ao texto indexado nesta auditoria.
                </>
              )
            }
            return (
              <>
                Este cenário baseia-se em {label} {suffix} — o dispositivo indexado para esta auditoria.
              </>
            )
          })()}
        </p>
      )}
      {!hidePdfButton ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LawPdfOpenButton chunkArticleId={chunkArticleId} prefetchedAnchor={data} />
        </div>
      ) : null}
    </div>
  )
}
