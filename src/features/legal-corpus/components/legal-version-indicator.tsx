"use client"

import { useState } from "react"
import { Scale } from "lucide-react"

import { ChangelogFiscalPanel } from "./changelog-fiscal-panel"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { useLawCorpus } from "@/lib/use-law-corpus"

export interface LegalVersionIndicatorProps {
  /** Quando true, mostra ponto de alerta (ex.: lei mudou e pode invalidar simulações salvas). */
  criticalAlert?: boolean
}

export function LegalVersionIndicator({ criticalAlert = false }: LegalVersionIndicatorProps) {
  const touchMeeting = useTouchMeetingMode()
  const [open, setOpen] = useState(false)
  const { changelog } = useLawCorpus()
  const version = changelog.version
  const label = changelog.label

  const ariaLabel = `Legislação ${label} versão ${version}. Abrir changelog fiscal.`

  const panel = <ChangelogFiscalPanel data={changelog} embedded={touchMeeting} />

  const triggerClass = cn(
    "relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-left transition-colors",
    "border-accent/25 bg-accent/8 text-accent hover:bg-accent/12",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98]",
    touchMeeting && "tribia-touch-target min-h-11 px-3",
  )

  const triggerInner = (
    <>
      {criticalAlert && (
        <span
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive shadow-sm"
          aria-hidden
        />
      )}
      <Scale className="size-3 shrink-0 opacity-90" strokeWidth={2.5} aria-hidden />
      <span className="hidden font-mono text-xs font-semibold uppercase tracking-wider sm:inline">
        {label} · v{version}
      </span>
      <span className="font-mono text-xs font-semibold uppercase tracking-wider sm:hidden">v{version}</span>
    </>
  )

  if (touchMeeting) {
    return (
      <>
        <button
          type="button"
          className={triggerClass}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {triggerInner}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showCloseButton
            className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
          >
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
              <SheetTitle className="text-base font-semibold text-foreground">
                Changelog fiscal · {label}
              </SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto">{panel}</div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={triggerClass}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {triggerInner}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        {panel}
      </PopoverContent>
    </Popover>
  )
}
