"use client"

// D3/Frente D — "Ter a opção de compartilhar": ao lado de "Exportar PDF" no
// resultado do dashboard (a contraparte pública já tem o par em
// public-report.tsx). onCopyLink garante o registro persistido (mesmo
// fluxo do "Gerar Dossiê digital" — machine-store.ts#openDossier) e copia a
// URL pública para a área de transferência; devolve a URL como sinal de
// sucesso para o feedback "Link copiado".
import { useState } from "react"
import { Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CopyDossierLinkButtonProps {
  onCopyLink: () => Promise<string | null>
  disabled?: boolean
  className?: string
}

export function CopyDossierLinkButton({ onCopyLink, disabled = false, className }: CopyDossierLinkButtonProps) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "failed">("idle")

  async function handleClick() {
    setState("busy")
    const url = await onCopyLink()
    if (url) {
      setState("copied")
      window.setTimeout(() => setState("idle"), 2000)
    } else {
      // Achado do re-critique: falha silenciosa deixava o usuário sem resposta.
      setState("failed")
      window.setTimeout(() => setState("idle"), 3000)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || state === "busy"}
      onClick={handleClick}
      className={cn("no-print print:hidden gap-1.5 border-border/60", className)}
    >
      <Link2 className="h-4 w-4 shrink-0" aria-hidden />
      {state === "copied"
        ? "Link copiado"
        : state === "failed"
          ? "Não foi possível copiar"
          : "Copiar link do dossiê"}
    </Button>
  )
}
