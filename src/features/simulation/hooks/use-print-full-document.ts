"use client"

// D3/Frente D — "de qualquer superfície, o impresso é o documento
// completo": em screen-tabs, o ReportRenderer só monta a secção da aba
// ativa (ver features/report/report-renderer.tsx); só mode="board" monta
// tudo. Sem este hook, imprimir a partir das abas (ou do atalho do Command
// Menu) saía só com a aba ativa + o chrome de impressão — cronograma,
// dossiê de auditoria e mesa de operações ficavam de fora do PDF.
//
// Mecanismo: activa o modo apresentação (o MESMO toggle do botão "Modo
// apresentação" — dashboard-results-view.tsx passa mode="board" ao
// renderDossier quando boardReadyActive), espera os gráficos lazy que
// ficaram fora do DOM até agora terminarem de carregar (marcador
// PRINT_PENDING_ATTR — lib/print-readiness.ts — aceso pelos fallbacks do
// next/dynamic em cronograma.tsx/sankey-flow.tsx) e só então chama
// window.print(). Reverte sozinho para o modo anterior depois do diálogo de
// impressão fechar (evento `afterprint`) — mas só quando foi este hook quem
// ligou o modo; se o usuário já estava em apresentação por escolha própria,
// não mexe.
import { useCallback, useRef } from "react"
import { PRINT_PENDING_SELECTOR } from "@/lib/print-readiness"

const POLL_INTERVAL_MS = 50
const MAX_WAIT_MS = 4000

function hasPendingPrintContent(): boolean {
  return typeof document !== "undefined" && document.querySelector(PRINT_PENDING_SELECTOR) !== null
}

/** Sonda o DOM até não haver mais conteúdo pendente, com tecto de tempo (nunca trava o print indefinidamente). */
function waitForPrintReadiness(onReady: () => void, elapsedMs = 0): void {
  if (!hasPendingPrintContent() || elapsedMs >= MAX_WAIT_MS) {
    onReady()
    return
  }
  setTimeout(() => waitForPrintReadiness(onReady, elapsedMs + POLL_INTERVAL_MS), POLL_INTERVAL_MS)
}

export interface UsePrintFullDocumentArgs {
  isBoardReady: boolean
  setIsBoardReady: (v: boolean) => void
}

export function usePrintFullDocument({ isBoardReady, setIsBoardReady }: UsePrintFullDocumentArgs) {
  const activatedByPrintRef = useRef(false)

  return useCallback(() => {
    if (isBoardReady) {
      // Já em apresentação (mode="board" no renderer) — o documento já está
      // completo, nada a montar antes de imprimir.
      window.print()
      return
    }

    activatedByPrintRef.current = true
    setIsBoardReady(true)

    function revertAfterPrint() {
      if (activatedByPrintRef.current) {
        activatedByPrintRef.current = false
        setIsBoardReady(false)
      }
    }

    // setTimeout(0): cede um turno ao React para montar a árvore completa
    // do board antes de sondar o DOM por conteúdo pendente.
    setTimeout(() => {
      waitForPrintReadiness(() => {
        window.addEventListener("afterprint", revertAfterPrint, { once: true })
        window.print()
      })
    }, 0)
  }, [isBoardReady, setIsBoardReady])
}
