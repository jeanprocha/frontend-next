import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CopyDossierLinkButton } from "./copy-dossier-link-button"

describe("CopyDossierLinkButton (D3 — compartilhar)", () => {
  it("mostra feedback 'Link copiado' quando onCopyLink resolve com uma URL", async () => {
    const onCopyLink = vi.fn().mockResolvedValue("https://tribia.app/report/abc")
    render(<CopyDossierLinkButton onCopyLink={onCopyLink} />)

    await userEvent.click(screen.getByRole("button", { name: /copiar link do dossiê/i }))

    expect(onCopyLink).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole("button", { name: /link copiado/i })).toBeInTheDocument())
  })

  it("declara a falha quando onCopyLink não devolve URL, em vez de voltar em silêncio", async () => {
    const onCopyLink = vi.fn().mockResolvedValue(null)
    render(<CopyDossierLinkButton onCopyLink={onCopyLink} />)

    await userEvent.click(screen.getByRole("button", { name: /copiar link do dossiê/i }))

    await waitFor(() => expect(onCopyLink).toHaveBeenCalledTimes(1))
    // Achado do re-critique: a falha silenciosa deixava o usuário sem resposta.
    expect(screen.getByRole("button", { name: /não foi possível copiar/i })).toBeInTheDocument()
  })
})
