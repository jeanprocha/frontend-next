import Decimal from "decimal.js"
import { parseApiDecimal } from "@/lib/money-decimal"
import type { ClassificationItem, EvidenceArticle } from "@/types/api"

export interface RepresentativeEvidencePick {
  classification: ClassificationItem
  evidence: EvidenceArticle
  maxSimilarity: number
}

export interface HeroEvidencePick {
  classification: ClassificationItem
  evidence: EvidenceArticle
  maxSimilarity: number
  /** Soma BRL das despesas elegíveis cuja melhor evidência aponta para este artigo; null se veio só do fallback por similaridade. */
  totalBrl: Decimal | null
}

/** Melhor trecho para vitrine: maior similaridade RAG entre todas as evidências das classificações. */
export function pickRepresentativeEvidence(
  classifications: ClassificationItem[],
): RepresentativeEvidencePick | null {
  let best: RepresentativeEvidencePick | null = null
  for (const c of classifications) {
    if (c.error) continue
    for (const ev of c.evidence ?? []) {
      const sim = Number(ev.similarity)
      if (!Number.isFinite(sim)) continue
      if (
        !best ||
        sim > best.maxSimilarity ||
        (sim === best.maxSimilarity && (ev.content?.length ?? 0) > (best.evidence.content?.length ?? 0))
      ) {
        best = {
          classification: c,
          evidence: ev,
          maxSimilarity: sim,
        }
      }
    }
  }
  return best
}

function bestEvidenceForLine(evidence: EvidenceArticle[] | undefined): EvidenceArticle | null {
  if (!evidence?.length) return null
  let best: EvidenceArticle | null = null
  let bestSim = -1
  for (const e of evidence) {
    const sim = Number(e.similarity)
    if (!Number.isFinite(sim)) continue
    if (
      !best ||
      sim > bestSim ||
      (sim === bestSim && (e.content?.length ?? 0) > (best?.content?.length ?? 0))
    ) {
      bestSim = sim
      best = e
    }
  }
  return best
}

/**
 * Artigo com maior peso em valor (despesas elegíveis): soma dos montantes por `article_id`
 * da melhor evidência de cada linha.
 */
export function pickHeroEvidenceByFinancialVolume(
  classifications: ClassificationItem[],
  expenses: { id: string; amount: string }[],
): HeroEvidencePick | null {
  type Agg = {
    total: Decimal
    bestEv: EvidenceArticle
    bestCls: ClassificationItem
    bestSim: number
  }
  const byArticle = new Map<string, Agg>()

  for (const exp of expenses) {
    const c = classifications.find((x) => x.client_id === exp.id)
    if (!c || c.error?.trim()) continue
    if (!c.is_eligible) continue // proxy base de crédito
    const ev = bestEvidenceForLine(c.evidence)
    if (!ev?.article_id?.trim()) continue
    const amt = parseApiDecimal(exp.amount)
    if (!amt || amt.lte(0)) continue

    const aid = ev.article_id.trim()
    const sim = Number(ev.similarity)
    const simN = Number.isFinite(sim) ? sim : 0

    const existing = byArticle.get(aid)
    if (!existing) {
      byArticle.set(aid, {
        total: amt,
        bestEv: ev,
        bestCls: c,
        bestSim: simN,
      })
    } else {
      existing.total = existing.total.add(amt)
      if (simN > existing.bestSim) {
        existing.bestSim = simN
        existing.bestEv = ev
        existing.bestCls = c
      }
    }
  }

  if (byArticle.size === 0) return null

  let winner: { articleId: string; agg: Agg } | null = null
  for (const [articleId, agg] of byArticle) {
    if (!winner) {
      winner = { articleId, agg }
      continue
    }
    const cmp = agg.total.cmp(winner.agg.total)
    if (cmp > 0 || (cmp === 0 && agg.bestSim > winner.agg.bestSim)) {
      winner = { articleId, agg }
    }
  }
  if (!winner) return null

  return {
    classification: winner.agg.bestCls,
    evidence: winner.agg.bestEv,
    maxSimilarity: winner.agg.bestSim,
    totalBrl: winner.agg.total,
  }
}

function representativeToHero(rep: RepresentativeEvidencePick): HeroEvidencePick {
  return {
    classification: rep.classification,
    evidence: rep.evidence,
    maxSimilarity: rep.maxSimilarity,
    totalBrl: null,
  }
}

/** Herói por valor; se impossível, maior similaridade global (R$ omitido). */
export function resolveHeroEvidencePick(
  classifications: ClassificationItem[],
  expenses: { id: string; amount: string }[],
): HeroEvidencePick | null {
  return (
    pickHeroEvidenceByFinancialVolume(classifications, expenses) ??
    (() => {
      const rep = pickRepresentativeEvidence(classifications)
      return rep ? representativeToHero(rep) : null
    })()
  )
}
