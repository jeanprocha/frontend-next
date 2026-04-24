import { SimulationPublicReportView } from "@/components/tax/simulation-public-report-view"
import { notFound } from "next/navigation"

type PageProps = { params: Promise<{ id: string }> }

/**
 * Dossié digital: página pública de leitura (UUID partilhável) — sem o chrome do simulador.
 */
export default async function PublicReportPage({ params }: PageProps) {
  const { id } = await params
  if (!id || id.trim() === "") notFound()
  return <SimulationPublicReportView id={id} />
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return {
    title: `Dossié tributário · TribIA${id ? ` · ${id.slice(0, 8)}` : ""}`,
    robots: { index: false, follow: false },
  }
}
