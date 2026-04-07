import { normalizeText } from "@/lib/strategy-tags-match"

/**
 * Converte índices de runas (pontos de código Unicode) para offsets UTF-16 usados por `String.slice` no JS.
 */
export function runeIndicesToUtf16Offsets(
  s: string,
  startRune: number,
  endRune: number,
): { start: number; end: number } | null {
  if (startRune < 0 || endRune < startRune) return null
  let r = 0
  let i = 0
  let uStart = -1
  const len = s.length
  while (i < len && r <= endRune) {
    const cp = s.codePointAt(i)
    if (cp === undefined) break
    const w = cp > 0xffff ? 2 : 1
    if (r === startRune) uStart = i
    if (r === endRune) {
      if (uStart < 0) return null
      return { start: uStart, end: i }
    }
    r++
    i += w
  }
  return null
}

/**
 * Primeiro intervalo de runas no texto original cuja normalização coincide com o padrão do chip.
 * Fallback: menor janela cuja normalização contém o padrão (paridade com `normInput.includes(pn)`).
 */
export function findNormalizedPatternRuneSpan(
  haystack: string,
  pattern: string,
): { start: number; end: number } | null {
  const needle = normalizeText(pattern)
  if (!needle) return null
  const runes = [...haystack]
  const n = runes.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j++) {
      if (normalizeText(runes.slice(i, j).join("")) === needle) {
        return { start: i, end: j }
      }
    }
  }
  for (let len = 1; len <= n; len++) {
    for (let i = 0; i + len <= n; i++) {
      const j = i + len
      if (normalizeText(runes.slice(i, j).join("")).includes(needle)) {
        return { start: i, end: j }
      }
    }
  }
  return null
}
