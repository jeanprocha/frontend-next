import { redirect } from "next/navigation"
import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { ROTAS } from "@/constants/routes"

/**
 * Destino do CTA primário da landing ("Abrir este dossiê") — Etapa M/PR 6.
 *
 * A curadoria do dossiê de exemplo é decisão de produto, não de código
 * (dados de uma empresa fictícia, mas com vazamentos e ao menos um override
 * de consultor, para o dossiê mostrar a trilha de divergência inteira) —
 * fica com o usuário (M-U3, docs/roadmap-execucao.md §4.2). Sem o registro
 * publicado, redirecionar cegamente devolveria "Dossiê indisponível." do
 * PublicReport, que não explica nada a quem chegou pela landing.
 */
export default function ExemploPage() {
  const exampleId = process.env.NEXT_PUBLIC_EXAMPLE_REPORT_ID?.trim()
  if (exampleId) redirect(ROTAS.relatorio(exampleId))

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <FileQuestion className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold text-foreground">
        O dossiê de exemplo ainda não foi publicado
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Esta demonstração pública está em preparação. Entre para rodar a sua
        própria simulação, ou volte em breve.
      </p>
      <Link
        href={ROTAS.inicio}
        className="text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Voltar ao início
      </Link>
    </main>
  )
}

export const metadata = {
  // Sem "· TribIA" no fim: o layout raiz já aplica `template: "%s · TribIA"`
  // a segmentos FILHOS (só o `app/page.tsx` do mesmo segmento escapa dele).
  // Repetir aqui rendia "Dossiê de exemplo · TribIA · TribIA" na aba.
  title: "Dossiê de exemplo",
  robots: { index: false, follow: false },
}
