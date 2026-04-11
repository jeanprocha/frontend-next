/**
 * URL do PDF oficial para abrir no leitor nativo do browser (nova aba).
 *
 * Usa o fragmento `#page=N` (PDF Open Parameters, suportado em Chrome, Edge, Firefox
 * e Safari para PDFs servidos directamente).
 *
 * A coordenada vertical fina (y dentro da página) não tem parâmetro de URL estável
 * nos leitores nativos; só a página é garantida.
 */
export function buildLawPdfExternalUrl(pdfUrl: string, page: number): string {
  const safePage = Math.max(1, Math.floor(Number.isFinite(page) ? page : 1))
  if (!pdfUrl.trim()) return ""
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost"
  try {
    const u = new URL(pdfUrl, base)
    u.hash = `page=${safePage}`
    return u.toString()
  } catch {
    const withoutHash = pdfUrl.split("#")[0]
    return `${withoutHash}#page=${safePage}`
  }
}
