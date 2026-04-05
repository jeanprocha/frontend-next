"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { ClassificationItem } from "@/types/api"
import { LegalBasisDrawer } from "./legal-basis-drawer"

interface EvidenceDrawerProps {
  item: ClassificationItem | null
  open: boolean
  onClose: () => void
}

const riskVariant: Record<string, "default" | "secondary" | "destructive"> = {
  baixo: "default",
  medio: "secondary",
  alto: "destructive",
}

// Formata o article_id em algo legível, ex: "lc68_0018_art_26_p2" → "Art. 26 §2"
function formatArticleId(id: string): string {
  return id
    .replace(/^lc68_\d+_/, "")
    .replace(/_p(\d+)$/, " §$1")
    .replace(/_/g, " ")
    .replace(/\bart\b/i, "Art.")
}

export function EvidenceDrawer({ item, open, onClose }: EvidenceDrawerProps) {
  const [lawChunkId, setLawChunkId] = useState<string | null>(null)
  const [lawOpen, setLawOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setLawOpen(false)
      setLawChunkId(null)
    }
  }, [open])

  return (
    <>
      {item ? (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base leading-snug">
                {item.description}
              </SheetTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge
              variant={item.is_eligible ? "default" : "destructive"}
              className={cn(
                item.is_eligible &&
                  "bg-accent text-accent-foreground hover:bg-accent/90",
              )}
            >
              {item.is_eligible ? "Elegível" : "Não Elegível"}
            </Badge>
            <Badge variant={riskVariant[item.risk_level] ?? "secondary"}>
              Risco {item.risk_level}
            </Badge>
            <Badge variant="outline">
              Confiança {Math.round(item.confidence * 100)}%
            </Badge>
          </div>
        </SheetHeader>

        <Separator className="mb-4" />

        {/* Justificativa */}
        <section className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Justificativa da IA
          </h3>
          <p className="text-sm leading-relaxed">{item.justification}</p>
          {item.legal_base && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs rounded-full bg-accent/10 border border-accent/20 text-accent px-2.5 py-1">
              <span className="font-mono font-semibold">⚖</span>
              {item.legal_base}
            </p>
          )}
        </section>

        {/* Artigos consultados */}
        {item.evidence && item.evidence.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Artigos consultados ({item.evidence.length})
            </h3>
            <div className="space-y-3">
              {item.evidence.map((art) => (
                <div
                  key={art.article_id}
                  className="rounded-lg border-l-2 border-l-accent bg-muted/40 p-3 text-xs"
                >
                  {/* Cabeçalho do artigo */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono font-semibold text-accent uppercase leading-tight">
                      {formatArticleId(art.article_id)}
                    </span>
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {(art.similarity * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Barra de similaridade */}
                  <div className="h-0.5 rounded-full bg-muted mb-2 overflow-hidden">
                    <div
                      className="h-0.5 rounded-full bg-accent transition-all"
                      style={{ width: `${art.similarity * 100}%` }}
                    />
                  </div>

                  {/* Texto do artigo */}
                  <p className="leading-relaxed text-foreground/80 line-clamp-6">
                    {art.content}
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-xs text-primary"
                    onClick={() => {
                      setLawChunkId(art.article_id)
                      setLawOpen(true)
                    }}
                  >
                    Artigo completo
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
          </SheetContent>
        </Sheet>
      ) : null}
      <LegalBasisDrawer
      chunkArticleId={lawChunkId}
      open={lawOpen}
      onOpenChange={(v) => {
        setLawOpen(v)
        if (!v) setLawChunkId(null)
      }}
    />
  </>
  )
}
