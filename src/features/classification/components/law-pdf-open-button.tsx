"use client"

import { useCallback, useState } from "react"
import { ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useCapability, useTribiaPlgTier } from "@/features/plg"
import { fetchLawPdfAnchor, fetchPublicLawPdfAnchor } from "@/lib/api"
import { buildLawPdfExternalUrl } from "@/lib/law-pdf-external-url"
import type { LawPdfAnchorResponse } from "@/types/api"

interface LawPdfOpenButtonProps {
  chunkArticleId: string
  /** Quando o pai já fez prefetch (ex.: `LawPdfAuthorityCard`), evita um segundo GET ao abrir. */
  prefetchedAnchor?: LawPdfAnchorResponse | null
  className?: string
}

/**
 * Abre o PDF oficial na página indexada (Pro). Free: não renderiza botão.
 */
export function LawPdfOpenButton({
  chunkArticleId,
  prefetchedAnchor,
  className,
}: LawPdfOpenButtonProps) {
  const pro = useCapability("pdfLegislationPro")
  const tier = useTribiaPlgTier()
  const { getToken, userId, isLoaded } = useAuth()
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openOfficialPdf = useCallback(async () => {
    if (!pro || !chunkArticleId.trim()) return
    setOpening(true)
    setError(null)
    try {
      const token = await getToken()
      // Sem sessão = dossiê público, lido por quem não tem conta. Antes isto
      // era um beco sem saída ("Inicie sessão para abrir o PDF oficial") no
      // ponto que materializa o diferencial do parecer; agora resolve pela
      // rota pública, que devolve a mesma ancoragem de um PDF oficial.
      const anchor =
        prefetchedAnchor ??
        (token && userId
          ? await fetchLawPdfAnchor(chunkArticleId, token, userId, tier)
          : await fetchPublicLawPdfAnchor(chunkArticleId))
      const href = buildLawPdfExternalUrl(anchor.pdf_url, anchor.page)
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer")
      } else {
        setError("URL do PDF indisponível.")
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Não foi possível obter a ancoragem.")
    } finally {
      setOpening(false)
    }
  }, [chunkArticleId, prefetchedAnchor, getToken, pro, tier, userId])

  if (!pro) {
    return null
  }

  return (
    <span className={className}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-8 shrink-0 gap-1.5 text-xs"
        disabled={!isLoaded || opening}
        onClick={() => void openOfficialPdf()}
      >
        <ExternalLink className="size-3.5" aria-hidden />
        {opening ? "Abrindo…" : "Abrir no PDF oficial"}
      </Button>
      {error ? <span className="ml-2 text-xs text-destructive">{error}</span> : null}
    </span>
  )
}
