"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BriefingSectionTitle } from "@/components/tax/briefing-section-title"
import { fetchLawArticle } from "@/lib/api"
import type { LawArticleResponse } from "@/types/api"

const BRIEFING_DESCRIPTION =
  "Nota técnica sintética — trilha entre o dado do cliente, a interpretação do modelo e a LC 68/2024."

interface LegalBasisDrawerProps {
  chunkArticleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LegalBasisDrawer({
  chunkArticleId,
  open,
  onOpenChange,
}: LegalBasisDrawerProps) {
  const [article, setArticle] = useState<LawArticleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- fetch e reset do modal ao abrir/fechar artigo LC 68 */
  useEffect(() => {
    if (!open || !chunkArticleId) {
      setArticle(null)
      setError(null)
      setCopied(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setArticle(null)

    fetchLawArticle(chunkArticleId)
      .then((data) => {
        if (!cancelled) setArticle(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Não foi possível carregar o artigo.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, chunkArticleId])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleCopy() {
    if (!article?.content) return
    try {
      await navigator.clipboard.writeText(article.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,680px)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden border-border/80 p-0 sm:w-full"
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-border/60 px-4 pb-4 pt-2 text-left">
          <DialogTitle className="font-heading pr-8 text-lg font-medium tracking-tight">
            Briefing de auditoria
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-xs leading-relaxed text-muted-foreground">
            {BRIEFING_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-4">
              <div>
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-6 w-3/4 max-w-md" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[88%]" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : article ? (
            <div className="space-y-6">
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Dispositivo</p>
                <p className="text-sm font-medium leading-snug text-foreground">
                  {article.title || "Consulta à lei"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs uppercase">
                    {article.source}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleCopy}
                    disabled={!article.content}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    {copied ? "Copiado" : "Copiar texto"}
                  </Button>
                </div>
              </div>

              <section>
                <BriefingSectionTitle>Texto legal</BriefingSectionTitle>
                <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-3 font-serif text-sm leading-relaxed text-foreground/90 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold">
                  <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>
              </section>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Conteúdo indisponível.</p>
          )}
        </div>

        <p className="shrink-0 border-t border-border/50 px-4 py-3 text-xs italic leading-relaxed text-muted-foreground">
          Texto conforme ingestão da LC 68/2024 no TribIA; sujeito a actualização legislativa e revisão editorial.
        </p>
      </DialogContent>
    </Dialog>
  )
}
