"use client"

import { useState } from "react"
import { ChevronRight, FileSearch, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  LineBriefingEvidencePanel,
  LineLawEvidencePanel,
} from "@/components/tax/line-evidence-popover-body"
import { cn } from "@/lib/utils"
import type { ClassificationItem } from "@/types/api"

const triggerClass = cn(
  "tribia-touch-target tribia-evidence-trigger shrink-0 gap-1 px-2 transition-opacity",
  "text-muted-foreground hover:text-foreground",
  "hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
)

const popoverBriefingClass = "w-[min(100vw-2rem,400px)] overflow-hidden p-0 shadow-md"
const popoverLawClass = "w-[min(100vw-2rem,min(520px,90vw))] overflow-hidden p-0 shadow-md"

interface ExpenseEvidenceColumnsProps {
  rowKey: string
  c: ClassificationItem
  touchMeeting: boolean
  onTouchOpen: (panel: "ia" | "lei") => void
}

/**
 * Colunas IA + Base legal: dois gatilhos com o mesmo painel ancorado (Popover) ou Sheet partilhado em touch.
 */
export function ExpenseEvidenceColumns({
  rowKey,
  c,
  touchMeeting,
  onTouchOpen,
}: ExpenseEvidenceColumnsProps) {
  const [whichPopover, setWhichPopover] = useState<null | "ia" | "lei">(null)

  const triggerInner = (
    <>
      <FileSearch className="size-3.5 shrink-0" aria-hidden />
      <MoreHorizontal className="size-3 shrink-0 opacity-80" aria-hidden />
      <span className="hidden min-[380px]:inline text-xs font-medium uppercase tracking-tight tribia-evidence-label">
        Evidências
      </span>
      <ChevronRight className="size-3.5 shrink-0 opacity-60 sm:hidden" aria-hidden />
    </>
  )

  if (touchMeeting) {
    return (
      <>
        <td className="px-1 py-2 text-center align-middle">
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              className={cn(triggerClass, "h-11 min-w-[44px] justify-center")}
              aria-label="Abrir briefing de auditoria desta linha"
              onClick={() => onTouchOpen("ia")}
            >
              {triggerInner}
            </Button>
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary h-auto py-1 px-2"
            onClick={() => onTouchOpen("lei")}
          >
            Ver lei
          </Button>
        </td>
      </>
    )
  }

  return (
    <>
      <td className="px-1 py-2 text-center align-middle">
        <div className="flex justify-center">
          <Popover
            open={whichPopover === "ia"}
            onOpenChange={(open) => setWhichPopover(open ? "ia" : null)}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(triggerClass, "h-8 w-8 justify-center opacity-45")}
                aria-label="Abrir briefing de auditoria desta linha"
                aria-expanded={whichPopover === "ia"}
                aria-haspopup="dialog"
              >
                <span className="relative inline-flex items-center">
                  <FileSearch className="size-3.5" aria-hidden />
                  <MoreHorizontal className="absolute -right-1 -bottom-0.5 size-2.5 opacity-70" aria-hidden />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className={popoverBriefingClass}>
              <LineBriefingEvidencePanel c={c} rowKey={rowKey} />
            </PopoverContent>
          </Popover>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <Popover
          open={whichPopover === "lei"}
          onOpenChange={(open) => setWhichPopover(open ? "lei" : null)}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary h-auto py-1 px-2"
              aria-expanded={whichPopover === "lei"}
              aria-haspopup="dialog"
            >
              Ver lei
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className={popoverLawClass}>
            <LineLawEvidencePanel c={c} rowKey={rowKey} />
          </PopoverContent>
        </Popover>
      </td>
    </>
  )
}
