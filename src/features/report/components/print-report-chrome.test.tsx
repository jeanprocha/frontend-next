import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PrintReportFooter, PrintReportHeader } from "./print-report-chrome"

function withQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe("PrintReportHeader — ano de foco declarado na identidade (D2)", () => {
  it("declara o ano de foco no masthead impresso", () => {
    render(<PrintReportHeader focusYear={2029} simulationContextLine="Empresa X" />)
    expect(screen.getByText("Ano de foco")).toBeInTheDocument()
    expect(screen.getByText("2029")).toBeInTheDocument()
  })

  it("sem focusYear, não força a linha de identificação a aparecer vazia", () => {
    render(<PrintReportHeader />)
    expect(screen.queryByText("Ano de foco")).not.toBeInTheDocument()
  })
})

describe("PrintReportFooter — referência de origem no dossiê público impresso (D3)", () => {
  it("inclui 'Dossiê verificável em {URL}' quando publicVerifyUrl é passada", () => {
    render(
      withQueryClient(
        <PrintReportFooter publicVerifyUrl="https://tribia.app/report/abc-123" />,
      ),
    )
    expect(screen.getByText(/Dossiê verificável em https:\/\/tribia\.app\/report\/abc-123/)).toBeInTheDocument()
  })

  it("sem publicVerifyUrl (dashboard/board), não inventa uma URL", () => {
    render(withQueryClient(<PrintReportFooter />))
    expect(screen.queryByText(/Dossiê verificável em/)).not.toBeInTheDocument()
  })

  it("inclui a referência também no rodapé white-label", () => {
    render(
      withQueryClient(
        <PrintReportFooter whiteLabel publicVerifyUrl="https://tribia.app/report/xyz" />,
      ),
    )
    expect(screen.getByText(/Dossiê verificável em https:\/\/tribia\.app\/report\/xyz/)).toBeInTheDocument()
  })
})
