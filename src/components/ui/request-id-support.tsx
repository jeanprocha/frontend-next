"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

/** Linha secundária: ID de pedido do backend + cópia para suporte (correlação com logs). */
export function RequestIdSupportRow({
  requestId,
  className,
}: {
  requestId: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div
      className={
        className ??
        "mt-2 flex flex-wrap items-center gap-2 border-t border-destructive/20 pt-2 text-xs text-muted-foreground"
      }
    >
      <span className="font-mono text-[0.7rem] text-foreground/85 break-all">
        ID do pedido: {requestId}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs shrink-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(requestId)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </Button>
      <span className="text-muted-foreground">Envie ao suporte para localizar o registro.</span>
    </div>
  )
}
