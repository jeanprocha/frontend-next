"use client"

import Link from "next/link"
import { Lock, Presentation } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface BoardReadyTeaseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Free / tablet: toque no cadeado Board-Ready abre folha inferior com tease (plano 08 + PLG).
 */
export function BoardReadyTeaseSheet({ open, onOpenChange }: BoardReadyTeaseSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[min(88vh,560px)] flex flex-col"
        showCloseButton
      >
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Lock className="size-4 text-muted-foreground" aria-hidden />
            </span>
            <SheetTitle className="text-lg font-medium">Modo apresentação — Pro</SheetTitle>
          </div>
          <SheetDescription className="text-xs leading-relaxed text-muted-foreground">
            Layout tipo relatório de conselho, tipografia de veredito e impressão otimizada. Disponível
            ao assinar o plano Pro.
          </SheetDescription>
        </SheetHeader>

        <div className="relative mx-1 flex-1 min-h-[140px] overflow-hidden rounded-xl border border-border/60 bg-muted/20">
          <div
            className="absolute inset-0 flex flex-col gap-2 p-4 opacity-55 blur-[6px] motion-reduce:blur-none motion-reduce:opacity-40 select-none pointer-events-none"
            aria-hidden
          >
            <div className="h-3 w-1/3 rounded bg-foreground/15" />
            <div className="h-2 w-full rounded bg-foreground/10" />
            <div className="h-2 w-5/6 rounded bg-foreground/10" />
            <div className="mt-4 h-24 rounded-lg bg-foreground/8" />
            <div className="h-2 w-2/3 rounded bg-foreground/10" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/85 via-background/40 to-transparent">
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-sm">
              <Presentation className="size-3.5 shrink-0" aria-hidden />
              Pré-visualização
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col border-t border-border/60 pt-2">
          <Link
            href="/#planos"
            className={cn(buttonVariants({ variant: "default", size: "default" }), "w-full")}
            onClick={() => onOpenChange(false)}
          >
            Ver planos Pro
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            O simulador e a classificação IA continuam completos no plano Free.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
