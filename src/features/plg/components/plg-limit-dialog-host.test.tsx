import { describe, expect, it } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { PlgLimitDialogHost } from "./plg-limit-dialog-host"
import { throwApiError } from "@/lib/http"

/**
 * Dispara o mesmo caminho de produção — `throwApiError` chama o listener
 * registrado pelo host (mount já rodou `setPlgLimitListener`) antes de
 * lançar. Não chamamos `setPlgLimitListener` diretamente no teste: isso
 * substituiria o listener do host em vez de simular um 403 de rede.
 */
function fire403(body: Record<string, unknown>) {
  try {
    throwApiError({ status: 403 } as Response, body, "fallback")
  } catch {
    // esperado — o listener já rodou antes do throw
  }
}

describe("PlgLimitDialogHost", () => {
  it("fica fechado até o primeiro 403 de quota", () => {
    render(<PlgLimitDialogHost />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("abre o diálogo quando o listener 403 dispara, sem linha de uso quando limit/used ausentes", () => {
    render(<PlgLimitDialogHost />)

    act(() => {
      fire403({ code: "quota_exceeded" })
    })

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByText(/Uso atual/)).not.toBeInTheDocument()
  })

  it("mostra a linha de uso quando o backend envia limit/used/plan", () => {
    render(<PlgLimitDialogHost />)

    act(() => {
      fire403({ code: "quota_exceeded", limit: 5, used: 6, plan: "free" })
    })

    expect(screen.getByText("Uso atual: 6 de 5 no plano free.")).toBeInTheDocument()
  })

  it("um segundo 403 não duplica o diálogo — só actualiza a info", () => {
    render(<PlgLimitDialogHost />)

    act(() => {
      fire403({ code: "quota_exceeded", limit: 5, used: 5, plan: "free" })
    })
    expect(screen.getAllByRole("dialog")).toHaveLength(1)

    act(() => {
      fire403({ code: "quota_exceeded", limit: 5, used: 6, plan: "free" })
    })
    expect(screen.getAllByRole("dialog")).toHaveLength(1)
    expect(screen.getByText("Uso atual: 6 de 5 no plano free.")).toBeInTheDocument()
  })
})
