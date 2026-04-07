"use client"

import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import {
  ClassificationBriefingContent,
  BRIEFING_AUDITORIA_DESCRIPTION,
} from "@/components/tax/classification-briefing-content"
import { BriefingSectionTitle } from "@/components/tax/briefing-section-title"
import { LawArticleIntegral } from "@/components/tax/law-article-integral"
import { firstEvidenceExcerpt, resolveLawArticleChunkId } from "@/lib/law-article-from-classification"
import type { ClassificationItem } from "@/types/api"

const footerNote =
  "Evidências e percentagens vêm da classificação em lote desta simulação. Texto legal remontado a partir dos chunks LC 68/2024 indexados no TribIA; sujeito a actualização legislativa."

const LAW_PANEL_DESCRIPTION =
  "Dispositivo e texto remontado a partir da classificação e dos chunks da lei indexados no TribIA (não substitui consulta oficial ao texto consolidado)."

function PanelChrome({
  title,
  description,
  rowKey,
  children,
}: {
  title: string
  description: string
  rowKey: string
  children: ReactNode
}) {
  return (
    <>
      <div className="border-b border-border/60 px-4 pb-3 pt-1 pr-10 text-left">
        <p className="font-heading text-lg font-medium tracking-tight text-foreground">{title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div key={rowKey} className="max-h-[min(72vh,520px)] overflow-y-auto px-4 py-4">
        {children}
      </div>
      <p className="border-t border-border/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">{footerNote}</p>
    </>
  )
}

/** Ícone IA: briefing de auditoria (sem texto legal integral). */
export function LineBriefingEvidencePanel({ c, rowKey }: { c: ClassificationItem; rowKey: string }) {
  return (
    <PanelChrome
      title="Briefing de auditoria"
      description={BRIEFING_AUDITORIA_DESCRIPTION}
      rowKey={rowKey}
    >
      <ClassificationBriefingContent c={c} withClosingNote={false} />
    </PanelChrome>
  )
}

/** «Ver lei»: foco no dispositivo e no texto legal (como o painel lateral antigo). */
export function LineLawEvidencePanel({ c, rowKey }: { c: ClassificationItem; rowKey: string }) {
  const chunkId = resolveLawArticleChunkId(c)
  const ragExcerpt = firstEvidenceExcerpt(c)
  const legalCite = c.legal_base?.trim()

  return (
    <PanelChrome title="Texto legal — LC 68/2024" description={LAW_PANEL_DESCRIPTION} rowKey={rowKey}>
      <div className="space-y-6">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Instância</p>
          <p className="text-sm font-medium leading-snug text-foreground">{c.description}</p>
        </div>

        {legalCite ? (
          <section>
            <BriefingSectionTitle>Citação na classificação</BriefingSectionTitle>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">
              {legalCite}
            </div>
          </section>
        ) : null}

        {chunkId ? (
          <LawArticleIntegral articleId={chunkId} />
        ) : ragExcerpt ? (
          <section>
            <BriefingSectionTitle>Trecho recuperado (RAG)</BriefingSectionTitle>
            <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-3 font-serif text-sm leading-relaxed text-foreground/90 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold">
              <ReactMarkdown>{ragExcerpt}</ReactMarkdown>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Sem identificador de chunk para remontar o artigo completo via API — mostramos o excerto devolvido pela
              recuperação semântica desta linha.
            </p>
          </section>
        ) : (
          <section>
            <BriefingSectionTitle>Texto legal integral</BriefingSectionTitle>
            <p className="text-sm text-muted-foreground">
              Não há chunk indexado nem trecho RAG com texto para esta linha. Use o ícone de evidências para rever o
              racional da classificação.
            </p>
          </section>
        )}
      </div>
    </PanelChrome>
  )
}
