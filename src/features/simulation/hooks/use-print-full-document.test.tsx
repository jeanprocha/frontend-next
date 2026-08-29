import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { PRINT_PENDING_ATTR } from "@/lib/print-readiness"
import { usePrintFullDocument } from "./use-print-full-document"

describe("usePrintFullDocument (D3 — de qualquer superfície, o impresso é o documento completo)", () => {
  let printSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    printSpy = vi.spyOn(window, "print").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ""
  })

  it("já em modo apresentação: imprime direto, sem tocar em setIsBoardReady", () => {
    const setIsBoardReady = vi.fn()
    const { result } = renderHook(() => usePrintFullDocument({ isBoardReady: true, setIsBoardReady }))

    act(() => result.current())

    expect(printSpy).toHaveBeenCalledTimes(1)
    expect(setIsBoardReady).not.toHaveBeenCalled()
  })

  it("fora do modo apresentação: activa o board (monta o documento completo) antes de imprimir", () => {
    const setIsBoardReady = vi.fn()
    const { result } = renderHook(() => usePrintFullDocument({ isBoardReady: false, setIsBoardReady }))

    act(() => result.current())

    expect(setIsBoardReady).toHaveBeenCalledWith(true)
    expect(printSpy).not.toHaveBeenCalled()

    act(() => {
      vi.runAllTimers()
    })

    expect(printSpy).toHaveBeenCalledTimes(1)
  })

  it("espera sumir o marcador de conteúdo pendente (gráfico lazy) antes de imprimir", () => {
    const pending = document.createElement("div")
    pending.setAttribute(PRINT_PENDING_ATTR, "")
    document.body.appendChild(pending)

    const setIsBoardReady = vi.fn()
    const { result } = renderHook(() => usePrintFullDocument({ isBoardReady: false, setIsBoardReady }))

    act(() => result.current())
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(printSpy).not.toHaveBeenCalled()

    pending.remove()
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(printSpy).toHaveBeenCalledTimes(1)
  })

  it("nunca trava indefinidamente: desiste de esperar após o tecto de tempo", () => {
    const pending = document.createElement("div")
    pending.setAttribute(PRINT_PENDING_ATTR, "")
    document.body.appendChild(pending)

    const setIsBoardReady = vi.fn()
    const { result } = renderHook(() => usePrintFullDocument({ isBoardReady: false, setIsBoardReady }))

    act(() => result.current())
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(printSpy).toHaveBeenCalledTimes(1)
  })

  it("reverte o modo apresentação sozinho após o 'afterprint' — só quando foi este hook quem ligou", () => {
    const setIsBoardReady = vi.fn()
    const { result } = renderHook(() => usePrintFullDocument({ isBoardReady: false, setIsBoardReady }))

    act(() => result.current())
    act(() => {
      vi.runAllTimers()
    })
    expect(setIsBoardReady).toHaveBeenCalledWith(true)

    act(() => {
      window.dispatchEvent(new Event("afterprint"))
    })
    expect(setIsBoardReady).toHaveBeenCalledWith(false)
  })

  it("não reverte nada quando já estava em modo apresentação por escolha do usuário", () => {
    const setIsBoardReady = vi.fn()
    const { result } = renderHook(() => usePrintFullDocument({ isBoardReady: true, setIsBoardReady }))

    act(() => result.current())
    act(() => {
      window.dispatchEvent(new Event("afterprint"))
    })

    expect(setIsBoardReady).not.toHaveBeenCalled()
  })
})
