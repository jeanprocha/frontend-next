// Etapa N/PR 9 (fato 12) — cobre os dois lados do critério de pronto: sem
// Premium mostra a tela travada com explicação (não um erro), com Premium
// salvar grava em unsafeMetadata via user.update() e mostra confirmação.
// Clerk/features-plg mockados aqui — nenhum outro teste do repo ainda
// renderizava algo que depende de useUser/useCapability, então não há
// ClerkProvider disponível no ambiente jsdom deste projeto.
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SettingsPage } from "./settings-page"

const updateMock = vi.fn(async () => {})
const capabilityMock = vi.fn(() => true)
const brandingMock = vi.fn(() => ({ brandingLogoUrl: null as string | null, brandingOrgName: null as string | null }))

vi.mock("@/lib/auth-client", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: { id: "u1", publicMetadata: {}, unsafeMetadata: {}, update: updateMock },
  }),
}))

vi.mock("@/features/plg", () => ({
  useCapability: () => capabilityMock(),
  useTribiaBranding: () => brandingMock(),
  PlgUpgradeDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">upgrade stub</div> : null,
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsPage breadcrumbItems={[{ label: "Configurações" }]} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  updateMock.mockClear().mockResolvedValue(undefined)
  capabilityMock.mockReturnValue(true)
  brandingMock.mockReturnValue({ brandingLogoUrl: null, brandingOrgName: null })
})

describe("SettingsPage — sem Premium", () => {
  it("mostra a tela travada com explicação, não um erro nem o formulário", () => {
    capabilityMock.mockReturnValue(false)
    renderPage()
    expect(screen.getByText("Marca do escritório — Premium")).toBeInTheDocument()
    expect(screen.queryByLabelText("Nome do escritório")).not.toBeInTheDocument()
  })

  it("o CTA abre o diálogo de upgrade", () => {
    capabilityMock.mockReturnValue(false)
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "Conhecer no Premium" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

describe("SettingsPage — com Premium", () => {
  it("pré-preenche o formulário com a marca já salva", () => {
    brandingMock.mockReturnValue({
      brandingLogoUrl: "https://exemplo.com/logo.png",
      brandingOrgName: "Escritório Exemplo",
    })
    renderPage()
    expect(screen.getByLabelText("Nome do escritório")).toHaveValue("Escritório Exemplo")
    expect(screen.getByLabelText("URL do logotipo")).toHaveValue("https://exemplo.com/logo.png")
  })

  it("salvar grava em unsafeMetadata (não publicMetadata) e confirma", async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText("Nome do escritório"), {
      target: { value: "Novo Escritório" },
    })
    fireEvent.change(screen.getByLabelText("URL do logotipo"), {
      target: { value: "https://exemplo.com/l.png" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        unsafeMetadata: {
          branding_logo_url: "https://exemplo.com/l.png",
          branding_org_name: "Novo Escritório",
        },
      }),
    )
    expect(await screen.findByText("Alterações salvas.")).toBeInTheDocument()
  })

  it("URL sem http(s):// é recusada com mensagem antes de chamar update", () => {
    renderPage()
    fireEvent.change(screen.getByLabelText("URL do logotipo"), {
      target: { value: "ftp://nao-e-http" },
    })
    expect(screen.getByRole("alert")).toHaveTextContent("Cole um link completo")

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))
    expect(updateMock).not.toHaveBeenCalled()
  })

  it("URL vazia é válida — limpa a marca em vez de ser recusada", () => {
    renderPage()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("erro ao salvar mostra mensagem em vez de falhar silenciosamente", async () => {
    updateMock.mockRejectedValueOnce(new Error("Falha de rede simulada"))
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))
    expect(await screen.findByText("Falha de rede simulada")).toBeInTheDocument()
  })

  it("editar um campo depois de salvar limpa a confirmação anterior", async () => {
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))
    expect(await screen.findByText("Alterações salvas.")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Nome do escritório"), { target: { value: "X" } })
    expect(screen.queryByText("Alterações salvas.")).not.toBeInTheDocument()
  })
})
