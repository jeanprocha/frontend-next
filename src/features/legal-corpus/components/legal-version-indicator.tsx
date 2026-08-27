"use client"

import { useState } from "react"
import { Radar, Scale } from "lucide-react"

import { ChangelogFiscalPanel } from "./changelog-fiscal-panel"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePlgCapabilities } from "@/features/plg"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { useLawCorpus } from "@/lib/use-law-corpus"

export interface LegalVersionIndicatorProps {
  /** Quando true, mostra ponto de alerta (ex.: lei mudou e pode invalidar simulações salvas). */
  criticalAlert?: boolean
}

export function LegalVersionIndicator({ criticalAlert = false }: LegalVersionIndicatorProps) {
  const cap = usePlgCapabilities()
  const touchMeeting = useTouchMeetingMode()
  const [open, setOpen] = useState(false)
  const { changelog } = useLawCorpus()
  const version = changelog.version
  const label = changelog.label

  const ariaLabel = `Legislação ${label} versão ${version}. Abrir changelog fiscal.`

  const plgRibbon = (
    <>
      {cap.complianceRadar && (
        <div className="border-b border-border bg-muted/25 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Radar className="size-3.5 shrink-0 text-accent" aria-hidden />
            Compliance Radar
          </p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            Alertas prioritários quando a {label} ou o motor determinístico mudam de versão — visão agregada
            Premium (roadmap).
          </p>
        </div>
      )}
      {cap.collectiveIntel && (
        <div className="border-b border-border bg-accent/5 px-4 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Inteligência colectiva
          </p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            Tendências anónimas dos chips de estratégia na rede TribIA (opt-in) — antecipe padrões fiscais.
          </p>
        </div>
      )}
    </>
  )

  const panel = (
    <>
      {plgRibbon}
      <ChangelogFiscalPanel data={changelog} embedded={touchMeeting} />
    </>
  )

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
