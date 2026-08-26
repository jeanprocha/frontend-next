// Movido de src/app/dashboard/page.tsx (FE-1, move puro).

/**
 * Extrai um «nome» legível do company_context.
 * Hierarquia:
 *  1. Texto antes do primeiro separador longo (— | - | :) se isso reduzir ruído.
 *  2. Primeira linha do contexto.
 *  3. Fallback institucional.
 * Puro, sem efeitos colaterais — seguro para useMemo.
 */
export function deriveSessionCompanyLabel(context: string | null | undefined): string {
  const trimmed = (context ?? "").trim()
  if (!trimmed) return "Contexto não definido"
  const firstLine = trimmed.split(/\r?\n/)[0] ?? ""
  // Heurística: extrair antes de — ou - ou : quando o resultado for mais curto e limpo.
  const match = firstLine.match(/^([^—\-:]{4,60})(?:\s*[—\-:])/)
  const candidate = match?.[1]?.trim()
  if (candidate && candidate.length < firstLine.length) return candidate
  return firstLine
}
