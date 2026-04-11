/** Segmento para renderização de realce cirúrgico (PRO). */
export type LegalHighlightSegment =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "tentative"; value: string }

type Range = { start: number; end: number; kind: "strong" | "tentative" }

function findMatchSpan(text: string, term: string): { start: number; end: number } | null {
  const t = term.trim()
  if (!t || [...t].length < 2) return null
  let i = text.indexOf(t)
  if (i >= 0) return { start: i, end: i + t.length }
  const low = text.toLowerCase()
  const lt = t.toLowerCase()
  i = low.indexOf(lt)
  if (i < 0) return null
  return { start: i, end: i + t.length }
}

function overlaps(a: Range, b: Range): boolean {
  return !(a.end <= b.start || a.start >= b.end)
}

function anyOverlap(r: Range, list: Range[]): boolean {
  return list.some((x) => overlaps(r, x))
}

/** Primeira ocorrência de cada termo (ordenados por comprimento desc), sem sobrepor ranges já usados. */
function collectNonOverlapping(text: string, terms: readonly string[], kind: "strong" | "tentative"): Range[] {
  const sorted = [...terms].filter(Boolean).sort((a, b) => b.length - a.length)
  const out: Range[] = []
  for (const term of sorted) {
    let search = 0
    while (search < text.length) {
      const sub = text.slice(search)
      const span = findMatchSpan(sub, term)
      if (!span) break
      const start = search + span.start
      const end = search + span.end
      const r: Range = { start, end, kind }
      if (!anyOverlap(r, out)) {
        out.push(r)
        break
      }
      search = start + 1
    }
  }
  return out
}

/**
 * Parte o texto em segmentos texto / strong / tentative sem sobreposição (strong prevalece).
 */
export function buildLegalHighlightSegments(
  text: string,
  strong: readonly string[],
  tentative: readonly string[],
): LegalHighlightSegment[] {
  const strongRanges = collectNonOverlapping(text, strong, "strong")
  const tentativeRaw = collectNonOverlapping(text, tentative, "tentative")
  const tentativeRanges = tentativeRaw.filter((r) => !anyOverlap(r, strongRanges))

  const merged = [...strongRanges, ...tentativeRanges].sort((a, b) => a.start - b.start)

  if (merged.length === 0) {
    return text ? [{ type: "text", value: text }] : []
  }

  const out: LegalHighlightSegment[] = []
  let cursor = 0
  for (const r of merged) {
    if (r.start > cursor) {
      out.push({ type: "text", value: text.slice(cursor, r.start) })
    }
    out.push({
      type: r.kind,
      value: text.slice(r.start, r.end),
    })
    cursor = r.end
  }
  if (cursor < text.length) {
    out.push({ type: "text", value: text.slice(cursor) })
  }
  return out
}
