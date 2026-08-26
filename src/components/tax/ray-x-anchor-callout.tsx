"use client"

import type { ReactNode } from "react"
import { ExternalLink } from "lucide-react"
import { useCallback, useState } from "react"
import { useAuth } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useTribiaPlanContext } from "@/components/tribia/tribia-plan-provider"
import { usePdfLegislationProAccess } from "@/hooks/use-tribia-plg-tier"
import { cn } from "@/lib/utils"
import { fetchLawPdfAnchor } from "@/lib/api"
import { buildLawPdfExternalUrl } from "@/lib/law-pdf-external-url"

interface RayXAnchorCalloutProps {
  /** article_id da linha do chunk (ligável a GET /law/articles e pdf-anchor). */
  chunkArticleId: string
  /** Dentro de card já delimitado: sem margem/borda superior extra. */
  compact?: boolean
  /** Rótulo à esquerda; com Pro, o botão PDF fica à direita na mesma linha. */
  leading?: ReactNode
}

/**
 * PRO: obtém ancoragem e abre o PDF oficial noutra aba com `#page=N`.
 * Free: apenas texto de contexto (sem chamada à API de ancoragem).
 */
export function RayXAnchorCallout({
  chunkArticleId,
  compact = false,
  leading,
}: RayXAnchorCalloutProps) {
  const pro = usePdfLegislationProAccess()
  const { tier } = useTribiaPlanContext()
  const { getToken, userId, isLoaded } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openOfficialPdf = useCallback(async () => {
    if (!pro || !chunkArticleId.trim()) return
    setError(null)
    setLoading(true)
    try {
      const token = await getToken()
      if (!token || !userId) {
        setError("Inicie sessão para abrir o PDF oficial.")
        return
      }
      const data = await fetchLawPdfAnchor(chunkArticleId, token, userId, tier)
      const href = buildLawPdfExternalUrl(data.pdf_url, data.page)
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer")
      } else {
        setError("URL do PDF indisponível.")
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Não foi possível obter a ancoragem.")
    } finally {
      setLoading(false)
    }
  }, [chunkArticleId, getToken, pro, tier, userId])

  const freeHint = (
    <p className="text-xs leading-relaxed text-muted-foreground">
      Texto remontado a partir dos chunks indexados. A abertura directa no PDF do Diário Oficial na página indexada é
      recurso <span className="font-medium text-foreground/90">Pro</span>.
    </p>
  )

  const pdfButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-8 shrink-0 gap-1.5 text-xs"
      disabled={!isLoaded || loading}
      onClick={() => void openOfficialPdf()}
    >
      <ExternalLink className="size-3.5" aria-hidden />
      {loading ? "A resolver…" : "Abrir no PDF oficial"}
    </Button>
  )

  if (leading != null) {
    return (
      <div className={cn(compact ? "pt-0" : "mt-3 border-t border-border/40 pt-3")}>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-h-8 min-w-0 flex-1 items-center [&_p]:m-0">{leading}</div>
          {pro ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {pdfButton}
              {error ? <span className="text-xs text-destructive">{error}</span> : null}
            </div>
          ) : null}
        </div>
        {!pro ? <div className="mt-2 border-t border-border/40 pt-2">{freeHint}</div> : null}
      </div>
    )
  }

  return (
    <div className={cn(compact ? "pt-0" : "mt-3 border-t border-border/40 pt-3")}>
      {!pro ? (
        freeHint
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {pdfButton}
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
        </div>
      )}
    </div>
  )
}
