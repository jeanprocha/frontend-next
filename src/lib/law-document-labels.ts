/**
 * Rótulo do documento legal a partir do PREFIXO do chunk ID do RAG (ex.:
 * "lc68_0052_art_52" → "LC 68/2024"). Camada base (como lib/) — o prefixo é
 * a mesma identidade gravada por DocumentProfile.IDPrefix no backend
 * (internal/ingestion/parse.go), então um dossiê salvo antes da re-ingestão
 * da Onda 2 continua citando corretamente o documento antigo, e um novo
 * dossiê cita o documento novo — sem migração de snapshot nenhuma: o próprio
 * ID já carrega a identidade.
 */
const PREFIX_LABELS: Record<string, string> = {
  lc68_: "LC 68/2024",
  lc214_: "LC 214/2025",
}

/** Prefixo desconhecido ou ID vazio → string vazia (chamador decide o fallback). */
export function labelForChunkId(id: string): string {
  const trimmed = id.trim()
  if (!trimmed) return ""
  for (const [prefix, label] of Object.entries(PREFIX_LABELS)) {
    if (trimmed.startsWith(prefix)) return label
  }
  return ""
}
