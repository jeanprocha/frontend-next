import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { ROTAS } from "@/constants/routes"
import { LAW_SOURCE_URL } from "@/lib/fiscal-law-changelog"

/**
 * O link de GitHub apontava para "https://github.com" (placeholder) —
 * removido em vez de mantido quebrado (docs/product/04-landing.md, decisão
 * em aberto nº 4). Reintroduzir com o repositório real é troca de uma linha.
 */
export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-tribia-canvas py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <span className="font-mono text-sm font-bold text-foreground">◈ TribIA</span>
        <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
          <Link href={ROTAS.privacidade} className="transition-colors hover:text-foreground">
            Privacidade e dados
          </Link>
          <a
            href={LAW_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Texto da lei
            <ExternalLink className="size-2.5" aria-hidden />
          </a>
        </nav>
        <p className="text-xs text-muted-foreground">Não é aconselhamento fiscal.</p>
      </div>
    </footer>
  )
}
