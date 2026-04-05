"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Copy, Gavel } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchLawArticle } from "@/lib/api"
import type { LawArticleResponse } from "@/types/api"

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 border-l sm:max-w-xl">
        <SheetHeader className="border-b pb-4 text-left">
          <div className="flex items-center gap-2 text-primary">
            <Gavel className="size-5 shrink-0" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-widest">
              Base legal
            </span>
          </div>
          <SheetTitle className="font-serif text-xl leading-snug pr-8">
            {loading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              article?.title ?? "Consulta à lei"
            )}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-5 w-40" />
            ) : article ? (
              <>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {article.source}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={handleCopy}
                  disabled={!article.content}
                >
                  <Copy className="size-3.5" />
                  {copied ? "Copiado" : "Copiar texto"}
                </Button>
              </>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-[88%]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[75%]" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : article ? (
              <div className="font-serif text-sm leading-relaxed text-foreground/90 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Conteúdo indisponível.</p>
            )}
          </div>
          <p className="shrink-0 border-t px-4 py-3 text-[10px] italic text-muted-foreground">
            Texto conforme ingestão da LC 68/2024 no TribIA; sujeito a atualização
            legislativa e revisão editorial.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
