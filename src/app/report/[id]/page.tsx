import { notFound } from "next/navigation"
import { PublicReportPage } from "./public-report-page"

type PageProps = { params: Promise<{ id: string }> }

/**
 * Dossiê digital: página pública de leitura (UUID partilhável) — sem o chrome do simulador.
 * Server Component só para generateMetadata; a composição da lista de
 * seções (referências de componente, não serializáveis pela fronteira RSC)
 * vive em public-report-page.tsx ("use client").
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params
  if (!id || id.trim() === "") notFound()
  return <PublicReportPage id={id} />
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return {
    // Sem "· TribIA" aqui: o template do layout raiz já o acrescenta ao
    // final. Com ele, a aba e o preview de todo link compartilhado saíam
    // "Dossiê tributário · TribIA · 1a2b3c4d · TribIA" — e este é o título
    // mais compartilhado do produto.
    title: `Dossiê tributário${id ? ` · ${id.slice(0, 8)}` : ""}`,
    robots: { index: false, follow: false },
  }
}
