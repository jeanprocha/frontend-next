"use client"

import { useEffect, useState } from "react"
import { setPlgLimitListener, type PlgLimitErrorInfo } from "@/lib/http"
import { PlgUpgradeDialog } from "./plg-upgrade-dialog"

function detailsFromInfo(info: PlgLimitErrorInfo): string | undefined {
  if (typeof info.used !== "number" || typeof info.limit !== "number") return undefined
  const planLabel = info.plan ? ` no plano ${info.plan}` : ""
  return `Uso atual: ${info.used} de ${info.limit}${planLabel}.`
}

/**
 * Host global do 403 PLG → diálogo (FE-3, PR 3a). Registra-se como o
 * `plgLimitListener` de `lib/http.ts` — todo 403 de quota/limite, venha da
 * máquina do pipeline ou de um `useQuery`/mutation, passa por `throwApiError`
 * e cai aqui. Idempotente: um segundo disparo (ex.: o retry automático das
 * mutations em `providers.tsx`) só atualiza `info`, não duplica o diálogo.
 */
export function PlgLimitDialogHost() {
  const [state, setState] = useState<{ open: boolean; info: PlgLimitErrorInfo | null }>({
    open: false,
    info: null,
  })

  useEffect(() => {
    setPlgLimitListener((info) => setState({ open: true, info }))
    return () => setPlgLimitListener(null)
  }, [])

  return (
    <PlgUpgradeDialog
      open={state.open}
      onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      feature="generic"
      details={state.info ? detailsFromInfo(state.info) : undefined}
    />
  )
}
