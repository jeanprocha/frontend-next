"use client"



import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"

import { LineUnifiedEvidencePanel } from "./line-evidence-popover-body"

import { cn } from "@/lib/utils"

import type { ClassificationItem } from "@/types/api"



/** Posição fixa na viewport (evita Radix Popper com anchor mínimo, que pode deixar o painel em `translate(0,-200%)` invisível). */

const CEDULA_BOTTOM = "200px"

const CEDULA_RIGHT = "90px"



const cedulaPanelClass =

  "w-[min(100vw-2rem,min(520px,90vw))] overflow-hidden p-0 shadow-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 duration-200"



interface ExpenseEvidenceColumnsProps {

  rowKey: string

  c: ClassificationItem

  touchMeeting: boolean

  onTouchOpen: () => void

}



/**

 * Coluna «Ver lei»: Cédula de auditoria (popover desktop ou sheet touch).

 */

export function ExpenseEvidenceColumns({

  rowKey,

  c,

  touchMeeting,

  onTouchOpen,

}: ExpenseEvidenceColumnsProps) {

  const [open, setOpen] = useState(false)

  const popoverContentRef = useRef<HTMLDivElement>(null)



  useEffect(() => {

    if (!open) return

    const onKey = (e: KeyboardEvent) => {

      if (e.key === "Escape") setOpen(false)

    }

    document.addEventListener("keydown", onKey)

    return () => document.removeEventListener("keydown", onKey)

  }, [open])



  /** Trava a rolagem da página sem `overflow: hidden` / `position: fixed` no body (assim a barra de rolagem não some). */

  useLayoutEffect(() => {

    if (!open) return

    const y = window.scrollY



    const isInsidePanel = (target: EventTarget | null) => {

      const root = popoverContentRef.current

      if (!root || !(target instanceof Node)) return false

      return root.contains(target)

    }



    const getInnermostScrollable = (root: HTMLElement, target: EventTarget | null): HTMLElement | null => {
      let node: Node | null =
        target instanceof Node ? target : null
      if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement
      let el: HTMLElement | null = node instanceof HTMLElement ? node : null
      if (!el && node) el = node.parentElement
      while (el && root.contains(el)) {
        const st = window.getComputedStyle(el)
        const oy = st.overflowY
        if (
          (oy === "auto" || oy === "scroll" || oy === "overlay") &&
          el.scrollHeight > el.clientHeight + 1
        ) {
          return el
        }
        el = el.parentElement
      }
      return null
    }

    const onWheel = (e: Event) => {
      const we = e as WheelEvent
      const root = popoverContentRef.current
      if (!root) return

      if (!root.contains(e.target as Node)) {
        e.preventDefault()
        return
      }

      const scrollEl = root.querySelector<HTMLElement>("[data-cedula-scroll]")
      if (!scrollEl) {
        e.preventDefault()
        return
      }

      // Cabeçalho / rodapé: o miolo recebe o delta via onWheel local; aqui impede sempre o scroll da página.
      if (!scrollEl.contains(e.target as Node)) {
        e.preventDefault()
        return
      }

      const inner = getInnermostScrollable(root, e.target)
      if (inner && inner !== scrollEl) {
        return
      }

      if (scrollEl.scrollHeight <= scrollEl.clientHeight + 1) {
        e.preventDefault()
        return
      }

      const atTop = scrollEl.scrollTop <= 0
      const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1
      if ((we.deltaY < 0 && atTop) || (we.deltaY > 0 && atBottom)) {
        e.preventDefault()
      }
    }

    const onTouchMove = (e: Event) => {

      if (isInsidePanel(e.target)) return

      e.preventDefault()

    }

    const onScroll = () => {

      if (window.scrollY !== y) window.scrollTo(0, y)

    }

    const scrollKeys = new Set([

      "ArrowUp",

      "ArrowDown",

      "PageUp",

      "PageDown",

      "Home",

      "End",

      " ",

    ])

    const onKeyDown = (e: KeyboardEvent) => {

      if (!scrollKeys.has(e.key)) return

      if (isInsidePanel(e.target)) return

      const el = e.target

      if (el instanceof HTMLElement) {

        const tag = el.tagName

        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return

      }

      e.preventDefault()

    }



    const nonPassive: AddEventListenerOptions = { passive: false }

    window.addEventListener("wheel", onWheel, nonPassive)

    window.addEventListener("touchmove", onTouchMove, nonPassive)

    const scrollOpts: AddEventListenerOptions = { passive: true }

    window.addEventListener("scroll", onScroll, scrollOpts)

    window.addEventListener("keydown", onKeyDown)



    return () => {

      window.removeEventListener("wheel", onWheel, nonPassive)

      window.removeEventListener("touchmove", onTouchMove, nonPassive)

      window.removeEventListener("scroll", onScroll, scrollOpts)

      window.removeEventListener("keydown", onKeyDown)

    }

  }, [open])



  if (touchMeeting) {

    return (

      <td className="px-4 py-3 text-right">

        <Button

          type="button"

          variant="ghost"

          size="sm"

          className="text-primary hover:text-primary h-auto py-1 px-2 print:hidden"

          onClick={onTouchOpen}

        >

          Ver lei

        </Button>

      </td>

    )

  }



  const overlay =

    open && typeof document !== "undefined"

      ? createPortal(

          <>

            <div

              className="fixed inset-0 z-40 bg-black/35 dark:bg-black/45 supports-[backdrop-filter]:backdrop-blur-[1px]"

              aria-hidden

              onClick={() => setOpen(false)}

            />

            <div

              ref={popoverContentRef}

              role="dialog"

              aria-modal="true"

              aria-label="Cédula de auditoria"

              data-state="open"

              style={{ bottom: CEDULA_BOTTOM, right: CEDULA_RIGHT }}

              className={cn(

                "fixed z-50 min-h-0 rounded-xl border border-border bg-popover text-popover-foreground outline-none",

                cedulaPanelClass,

              )}

            >

              <LineUnifiedEvidencePanel c={c} rowKey={rowKey} />

            </div>

          </>,

          document.body,

        )

      : null



  return (

    <td className="px-4 py-3 text-right">

      {overlay}

      <Button

        type="button"

        variant="ghost"

        size="sm"

        className="text-primary hover:text-primary h-auto py-1 px-2 print:hidden"

        aria-expanded={open}

        aria-haspopup="dialog"

        onClick={() => setOpen((o) => !o)}

      >

        Ver lei

      </Button>

    </td>

  )

}


