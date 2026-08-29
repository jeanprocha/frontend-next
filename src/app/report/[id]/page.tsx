import { notFound } from "next/navigation"
import { getPublicSimulationRecord } from "@/lib/api"
import { deriveSessionCompanyLabel } from "@/lib/session-labels"
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

/**
 * A5 — achado do critique: o UUID cru no `<title>` da aba é metalinguagem de
 * sistema, não identificação do documento. Busca o registro no servidor só
 * para extrair o nome da empresa (`company_context`, mesma heurística do
 * carimbo de sessão); falha de rede/404 cai no título genérico — nunca
 * bloqueia a página nem inventa nome.
 */
async function resolveCompanyLabelForMetadata(id: string): Promise<string | null> {
  try {
    const detail = await getPublicSimulationRecord(id)
    const label = deriveSessionCompanyLabel(detail.company_context)
    return label && label !== "Contexto não definido" ? label : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const companyLabel = id && id.trim() !== "" ? await resolveCompanyLabelForMetadata(id) : null
  return {
    // Sem "· TribIA" aqui: o template do layout raiz já o acrescenta ao
    // final. Sem UUID no título (achado do critique): usa o nome da empresa
    // quando o registro resolve no servidor, cai para o título genérico
    // quando não.
    title: companyLabel ? `Dossiê tributário · ${companyLabel}` : "Dossiê tributário",
    robots: { index: false, follow: false },
  }
}
