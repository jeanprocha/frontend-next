"use client"

import { useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type PlgUpgradeFeature = "compare_ab" | "board_ready" | "rayx" | "white_label" | "generic"

const COPY: Record<
  PlgUpgradeFeature,
  { title: string; body: string }
> = {
  compare_ab: {
    title: "Comparar cenários (A/B)",
    body:
      "No plano Pro congela uma simulação de referência, ajusta premissas e vê o veredito executivo lado a lado — ideal para reuniões de conselho e decisões de preço.",
  },
  board_ready: {
    title: "Modo apresentação Board-Ready",
    body:
      "Relatório executivo tipográfico, impressão sem marca d’água Free e narrativa preparada para o board. Disponível no Pro e superiores.",
  },
  rayx: {
    title: "Raio-X completo no contexto e na lei",
    body:
      "No Pro o trecho do contexto que sustenta a auditoria fica nítido no campo central, com base legal integral na legislação vigente e lista de evidências RAG sem desfocagem — trilha completa para consultores e CFO.",
  },
  white_label: {
    title: "Marca do escritório no dossiê",
    body:
      "No plano Premium, seu logotipo e o nome do escritório substituem a marca TribIA no cabeçalho dos dossiês PDF e impressos — pronto para levar ao cliente com a sua identidade.",
  },
  generic: {
    title: "TribIA Pro — mais profundidade para o seu fluxo",
    body:
      "Do retrato isolado ao filme completo da reforma (2026–2033): série temporal, gestão de picos, comparativo A/B, Raio-X na lei, histórico rico e Board-Ready — para consultoria e leitura CFO-adjacente, não só uma simulação pontual.",
  },
}

export function PlgUpgradeDialog({
  open,
  onOpenChange,
  feature,
  details,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: PlgUpgradeFeature
  /** Linha extra opcional (ex.: "Uso atual: 8 de 5 no plano free") — hoje só o interceptor 403 a passa. */
  details?: string
}) {
  const c = COPY[feature]
  const lastFocusRef = useRef<HTMLElement | null>(null)

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        const el = document.activeElement
        lastFocusRef.current = el instanceof HTMLElement ? el : null
      }
      onOpenChange(next)
    },
    [onOpenChange],
  )

  const handleCloseAutoFocus = useCallback((e: Event) => {
    const el = lastFocusRef.current
    if (el && document.contains(el) && typeof el.focus === "function") {
      e.preventDefault()
      el.focus({ preventScroll: true })
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md border-border/80"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {c.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {c.body}
          </DialogDescription>
        </DialogHeader>
        {details && <p className="text-sm font-medium">{details}</p>}
        <p className="text-xs text-muted-foreground">
          O plano da sua conta define os limites e funcionalidades disponíveis. Para subir de plano ou resolver
          inconsistências, contate o suporte ou o administrador da sua organização.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={() => handleOpenChange(false)}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
