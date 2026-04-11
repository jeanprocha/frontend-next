"use client"

/**
 * SimulationRecalcBridge — item 3.4.2 (ponte store → motor Go).
 *
 * RESPONSABILIDADE ÚNICA:
 *   Observar `overrideRecalcTick` do store e, quando há resultados form
 *   activos e o modo apresentação está desligado, agendar um recálculo com
 *   debounce de 800ms via `useSimulationRecalc`.
 *
 * MANTRA (tribia_core_rules §1):
 *   Este componente NÃO faz cálculo tributário. Orquestra apenas o disparo
 *   do POST /simulations e o cleanup do timer. A matemática fica no Go.
 *
 * CANCELAMENTO DE DEBOUNCE (anti-leak):
 *   - O cleanup do useEffect cancela qualquer timer pendente ao desmontar
 *     ou ao reagir a uma nova mudança de tick antes dos 800ms expirarem.
 *   - Ao desmontar (unmount): componente removido quando results === null,
 *     phase muda para "form", ou rota muda — o cleanup corre automaticamente.
 *
 * GUARDA BOARD-READY (system.md — modo apresentação):
 *   Se presentationMode === true, não agenda recálculo automático.
 *   O botão «Sincronizar Parecer» (gerido pelo pai) fica responsável pelo
 *   disparo manual quando o consultor estiver pronto.
 *
 * CORRIDAS:
 *   Se mutation.isPending, não agenda novo tick — React Query já rejeita
 *   chamadas sobrepostas ao mesmo mutationKey; a guarda aqui reforça que
 *   o timer nem começa em caso de resposta lenta.
 *
 * RENDERIZAÇÃO:
 *   Componente sem output visual — retorna null. Montado como filho invisível
 *   dentro da árvore de resultados em dashboard/page.tsx.
 */

import { useEffect } from "react"
import { useTaxStore } from "@/store/useTaxStore"
import { useSimulationRecalc } from "@/hooks/use-simulation-recalc"

export function SimulationRecalcBridge() {
  const overrideRecalcTick = useTaxStore((s) => s.overrideRecalcTick)
  const results = useTaxStore((s) => s.results)
  const presentationMode = useTaxStore((s) => s.presentationMode)

  const { recalculateDebounced, cancelDebounce, isRecalculating } =
    useSimulationRecalc()

  useEffect(() => {
    // Tick 0 = estado inicial sem overrides — não disparar.
    if (overrideRecalcTick === 0) return

    // Sem resultados form activos: cancelar e aguardar nova simulação completa.
    if (!results || results.mode !== "form") {
      cancelDebounce()
      return
    }

    // Modo apresentação: proteger o relatório oficial de alterações acidentais.
    // O botão «Sincronizar Parecer» no pai trata o disparo manual.
    if (presentationMode) {
      cancelDebounce()
      return
    }

    // Não sobrepor requisição já em curso.
    if (isRecalculating) return

    recalculateDebounced()

    // Cleanup: cancela o timer se o componente desmontar ou se um novo tick
    // chegar antes dos 800ms (padrão normal em overrides rápidos em série).
    return () => {
      cancelDebounce()
    }
  }, [overrideRecalcTick]) // eslint-disable-line react-hooks/exhaustive-deps
  // Dependências estabilizadas: recalculateDebounced/cancelDebounce são
  // useCallback estáveis; results/presentationMode/isRecalculating são lidos
  // dentro do efeito para evitar re-disparar por mudanças de render não
  // relacionadas ao tick de override.

  return null
}
