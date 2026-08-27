/**
 * Quais documentos legais um dossiê SALVO efetivamente citou (W1/Onda 2, PR 2).
 *
 * O selo de base legal lia o corpus ao vivo (`useLawCorpus().changelog`), que
 * é sempre o documento CORRENTE. No instante em que a LC 214/2025 virar
 * corrente, todo dossiê já salvo passaria a exibir "Base legal LC 214/2025"
 * enquanto suas citações apontam chunks `lc68_` — exatamente a afirmação
 * não-sustentada que o W1 existe para impedir.
 *
 * A identidade do documento já está gravada no PREFIXO do `article_id` de cada
 * evidência (`DocumentProfile.IDPrefix` no backend, `internal/ingestion/parse.go`),
 * e o catálogo de `GET /law/corpus` expõe o mesmo prefixo em
 * `LawCorpusDocument.chunk_prefix`. Casar os dois dá rótulo E data-base
 * corretos para o documento que o registro citou, sem migrar snapshot nenhum:
 * o dado ao vivo continua sendo a fonte, mas indexado pelo que o registro
 * realmente usou — fato de execução, não o estado de hoje.
 */
import type { ClassificationItem } from "@/types/api"
import type { LawCorpusDocument } from "@/lib/api/legal"

/** Subconjunto de SimulationRecord de que esta função precisa — evita acoplar lib↔lib por um tipo inteiro. */
export interface RecordWithClassifications {
  classifications?: ClassificationItem[]
  serviceClassifications?: ClassificationItem[]
}

/** Todos os article_id de evidência do registro, de despesas e de serviços. */
function citedArticleIds(record: RecordWithClassifications): string[] {
  const items = [...(record.classifications ?? []), ...(record.serviceClassifications ?? [])]
  const ids: string[] = []
  for (const item of items) {
    // evidence é obrigatório no tipo, mas registros antigos podem chegar sem
    // ele no JSONB — o snapshot é imutável, então nunca foi reescrito.
    for (const ev of item?.evidence ?? []) {
      const id = ev?.article_id?.trim()
      if (id) ids.push(id)
    }
  }
  return ids
}

/**
 * Documentos do catálogo que o registro citou, na ordem em que aparecem em
 * `documents` (estável entre renders). Lista vazia = o registro não tem
 * evidência com âncora reconhecível — o chamador não deve afirmar base legal
 * nenhuma nesse caso.
 *
 * Documento sem `chunk_prefix` nunca casa: sem o prefixo não há como provar
 * que o registro o citou, e adivinhar seria fabricar.
 */
export function lawDocumentsCitedByRecord(
  record: RecordWithClassifications,
  documents: LawCorpusDocument[],
): LawCorpusDocument[] {
  const ids = citedArticleIds(record)
  if (ids.length === 0) return []

  return documents.filter((doc) => {
    const prefix = doc.chunk_prefix?.trim()
    if (!prefix) return false
    return ids.some((id) => id.startsWith(prefix))
  })
}
