"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BriefingSectionTitle } from "@/components/tax/briefing-section-title"
import { fetchLawArticle } from "@/lib/api"
import type { LawArticleResponse } from "@/types/api"

interface LawArticleIntegralProps {
  articleId: string | null
}

/**
 * Trecho remontado da LC 68/2024 (GET /law/articles) — mesmo tratamento visual que o modal «Base legal».
 */
export function LawArticleIntegral({ articleId }: LawArticleIntegralProps) {
  const [article, setArticle] = useState<LawArticleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- fetch do artigo ao mudar id */
  useEffect(() => {
    if (!articleId) {
      setArticle(null)
      setError(null)
      setCopied(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setArticle(null)

    fetchLawArticle(articleId)
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
  }, [articleId])
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

  if (!articleId) {
    return (
      <section className="mt-6">
        <BriefingSectionTitle>Texto legal integral</BriefingSectionTitle>
        <p className="text-sm text-muted-foreground">
          Não há artigo indexado para esta linha — apenas a citação resumida em «Base legal».
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6">
      <BriefingSectionTitle>Texto legal integral</BriefingSectionTitle>
      {loading ? (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/15 p-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : article ? (
        <div className="rounded-lg border border-border/60 bg-muted/15">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-3 py-2.5">
            <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{article.title}</p>
            <Badge variant="secondary" className="shrink-0 text-xs uppercase">
              {article.source}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 text-xs"
              onClick={handleCopy}
              disabled={!article.content}
            >
              <Copy className="size-3.5" aria-hidden />
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <div className="px-3 py-3 font-serif text-sm leading-relaxed text-foreground/90 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Conteúdo indisponível.</p>
      )}
    </section>
  )
}
