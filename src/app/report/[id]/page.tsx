import { notFound } from "next/navigation"
import { PublicReportPage } from "./public-report-page"

type PageProps = { params: Promise<{ id: string }> }

/**
 * Dossié digital: página pública de leitura (UUID partilhável) — sem o chrome do simulador.
 * Server Component só para generateMetadata; a composição da lista de
 * secções (referências de componente, não serializáveis pela fronteira RSC)
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
    title: `Dossié tributário · TribIA${id ? ` · ${id.slice(0, 8)}` : ""}`,
    robots: { index: false, follow: false },
  }
}
