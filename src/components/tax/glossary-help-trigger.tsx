"use client"

import { useState, type ReactNode } from "react"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface GlossaryHelpTriggerProps {
  content: ReactNode
  /** Rótulo acessível do gatilho (e título do Sheet se `sheetTitle` omitido). */
  ariaLabel: string
  sheetTitle?: string
  children: ReactNode
  className?: string
  contentClassName?: string
  side?: "top" | "bottom"
  /** Ícones pequenos: Sheet + alvo táctil (`.tribia-touch-target`). Texto: Popover. */
  preferSheetOnTouch?: boolean
}

/**
 * Ajuda contextual: Tooltip em pointer fino; Popover ou Sheet em meeting / touch (§10).
 */
export function GlossaryHelpTrigger({
  content,
  ariaLabel,
  sheetTitle,
  children,
  className,
  contentClassName,
  side = "top",
  preferSheetOnTouch = false,
}: GlossaryHelpTriggerProps) {
  const touchMeeting = useTouchMeetingMode()
  const [open, setOpen] = useState(false)

  if (!touchMeeting) {
    return (
      <Tooltip>
        <TooltipTrigger className={cn(className)} aria-label={ariaLabel}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className={contentClassName}>
          {content}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (preferSheetOnTouch) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("tribia-touch-target shrink-0", className)}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {children}
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[min(85vh,560px)] overflow-y-auto rounded-t-2xl"
            showCloseButton
          >
            <SheetHeader className="text-left">
              <SheetTitle className="text-base font-medium">
                {sheetTitle ?? ariaLabel}
              </SheetTitle>
            </SheetHeader>
            <div
              className={cn(
                "pt-2 text-sm leading-relaxed text-foreground",
                contentClassName,
              )}
            >
              {content}
            </div>
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
          className={cn(
            "inline max-w-full bg-transparent p-0 font-inherit text-left text-inherit",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        className={cn("w-[min(100vw-2rem,320px)] p-3", contentClassName)}
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
