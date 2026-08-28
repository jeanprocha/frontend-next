// Passos assíncronos da máquina — port de use-simulation.ts (classify+simulate)
// e use-simulation-recalc.ts (recalc), unificados no persist único (build-record-payload).
// classifyStep/simulateStep (FE-3, PR 3b) são os passos do registry
// (step-registry.ts) — devolvem StepOutcome, não MachineEvent; o executor
// (machine-store.ts) traduz para STEP_SUCCEEDED/STEP_FAILED. runRecalc/
// runPersist continuam funções soltas: não são passos do pipeline (recalc é
// ciclo do estado `ready`, persist é sempre um comando emitido por outro
// passo/evento) e por isso continuam devolvendo MachineEvent diretamente.
// I/O e efeitos colaterais (setQueryData, highlights, telemetria) ficam
// aqui, na mesma ordem do original.
import { classifyBatch } from "@/lib/api/classification"
import { simulate, saveSimulationRecord } from "@/lib/api/simulation"
import { queryKeys } from "@/lib/api/query-keys"
import { getEffectiveExpenseSimulationFields } from "@/lib/classification-effective"
import { aggregateRagMetadata } from "@/lib/rag-metadata"
import { dedupeStrategyTagsByPattern, normalizeText } from "@/lib/strategy-tags-match"
import { emitStrategyTagConfirmed } from "../lib/strategy-tags-telemetry"
import { useTaxStore } from "@/store/useTaxStore"
import { isImobiliarioRegime } from "@/lib/company-regime"
import type { StrategyTag, StrategyTagsListResponse } from "@/types/api"
import { buildSimulationRecordCreatePayload } from "./build-record-payload"
import type {
  ClassifiedInput,
  FormResults,
  MachineEvent,
  PersistOrigin,
  ReportBrand,
  SimulationInput,
  Step,
  StepCtx,
} from "./machine-types"

// ─── Prefixos de contexto por regime (verbatim de use-simulation.ts) ─────────

const PREFIX_CLASSIFY_DIFERENCIADO_60 =
  "[Perfil simulador: empresa enquadrável no regime diferenciado da legislação vigente (saúde, educação, cultura; Art. 131). " +
  "Avalie com rigor se cada item é coerente com essa atividade e elegível a crédito; use só trechos da lei recuperados como base.]\n\n"

const PREFIX_CLASSIFY_ALIQUOTA_ZERO =
  "[Perfil simulador: company_regime aliquota_zero — operação voltada à Cesta Básica Nacional / alíquota zero CBS+IBS na saída (Anexo I da legislação vigente). " +
  "Para cada receita ou despesa, verifique se o item é literalmente coberto pelos trechos recuperados; arroz, feijão etc. podem ser reduzido_zero se a lei no contexto assim indicar; " +
  "itens fora da cesta (ex.: luxo) devem ser regime_type padrao. Use apenas trechos da lei recuperados como base.]\n\n"

const PREFIX_CLASSIFY_IMOBILIARIO =
  "[Perfil simulador: setor imobiliário (incorporação, venda ou locação — ilustrativo). " +
  "Priorize elegibilidade a crédito IBS/CBS em materiais de construção (cimento, aço, etc.), serviços de empreiteira e subempreitada usados na atividade, " +
  "sempre com base nos trechos recuperados da lei; não invente regras.]\n\n"

const PREFIX_CLASSIFY_PROF_LIBERAL =
  "[Perfil simulador: company_regime prof_liberal — sociedade ou escritório de profissões regulamentadas (advocacia, engenharia, contabilidade, arquitetura; ilustrativo). " +
  "Priorize elegibilidade a crédito em software de gestão e ERP jurídico, assinaturas digitais, bases de dados profissionais, certificações e locação de sala/escritório alinhados à atividade-fim; " +
  "use apenas trechos da lei recuperados como base.]\n\n"

const PREFIX_CLASSIFY_EXPORTADORA =
  "[Perfil simulador: company_regime exportadora — operação com foco em mercado externo (exportação, ilustrativo). " +
  "Priorize análise de elegibilidade a crédito IBS/CBS em fretes internacionais, armazenagem portuária ou logística, despachante aduaneiro e insumos ligados à cadeia de exportação, " +
  "sempre com base exclusiva nos trechos da lei recuperados abaixo; não afirme benefício sem âncora no texto.]\n\n"

const PREFIX_CLASSIFY_ENTIDADE_IMUNE =
  "[Perfil simulador: company_regime entidade_imune — entidade imune ou ISFL (ilustrativo). " +
  "No modelo TribIA a entidade não apropria créditos de IBS/CBS nas compras; avalie elegibilidade de forma conservadora e ancore qualquer conclusão nos trechos recuperados da lei; " +
  "não prometa crédito sem suporte explícito no contexto.]\n\n"

function classificationContextForAI(companyContext: string, companyRegime: SimulationInput["companyRegime"]): string {
  if (companyRegime === "diferenciado_60") return PREFIX_CLASSIFY_DIFERENCIADO_60 + companyContext
  if (companyRegime === "aliquota_zero") return PREFIX_CLASSIFY_ALIQUOTA_ZERO + companyContext
  if (isImobiliarioRegime(companyRegime)) return PREFIX_CLASSIFY_IMOBILIARIO + companyContext
  if (companyRegime === "prof_liberal") return PREFIX_CLASSIFY_PROF_LIBERAL + companyContext
  if (companyRegime === "exportadora") return PREFIX_CLASSIFY_EXPORTADORA + companyContext
  if (companyRegime === "entidade_imune") return PREFIX_CLASSIFY_ENTIDADE_IMUNE + companyContext
  return companyContext
}

function mapByClientId<T extends { client_id?: string; description: string }>(results: T[]): Map<string, T> {
  const m = new Map<string, T>()
  for (const r of results) {
    const key = (r.client_id && r.client_id.trim()) || r.description
    m.set(key, r)
  }
  return m
}

function mergeDiscoveredStrategyTags(
  a: { discovered_tags?: StrategyTag[] },
  b: { discovered_tags?: StrategyTag[] },
): StrategyTag[] {
  const m = new Map<string, StrategyTag>()
  for (const d of [...(a.discovered_tags ?? []), ...(b.discovered_tags ?? [])]) {
    const p = normalizeText(d.pattern)
    if (!p) continue
    m.set(p, { ...d, pattern: p, color_scheme: d.color_scheme?.trim() || "emerald" })
  }
  return [...m.values()]
}

async function resolvePlgAuth(ctx: StepCtx) {
  const token = await ctx.getToken()
  return token && ctx.userId ? { token, userId: ctx.userId, plan: ctx.plan } : null
}

// ─── classify ─────────────────────────────────────────────────────────────

/** Primeiro passo do registry (step-registry.ts) — classifica serviços e despesas. */
export const classifyStep: Step = {
  id: "classify",
  uiStage: "classification",
  async run(input, acc, ctx) {
    try {
      const plgAuth = await resolvePlgAuth(ctx)
      const ctxForClassify = classificationContextForAI(input.companyContext, input.companyRegime)

      // Serviços → regime_type; Despesas → is_eligible + regime_type. Em paralelo,
      // como no original — dois POSTs concorrentes ao classificador RAG+LLM.
      const [svcClassResult, expClassResult] = await Promise.all([
        classifyBatch(
          input.services.map((s) => ({ client_id: s.id, description: s.description, context: ctxForClassify })),
          5,
          plgAuth,
        ),
        classifyBatch(
          input.expenses.map((e) => ({ client_id: e.id, description: e.description, context: ctxForClassify })),
          5,
          plgAuth,
        ),
      ])

      const discoveredTags = mergeDiscoveredStrategyTags(svcClassResult, expClassResult)
      if (discoveredTags.length > 0) {
        ctx.queryClient.setQueryData<StrategyTagsListResponse>(queryKeys.strategyTags.all, (old) => {
          const cur = old?.tags ?? []
          const seen = new Set(cur.map((t) => normalizeText(t.pattern)))
          const next = [...cur]
          for (const d of discoveredTags) {
            const p = normalizeText(d.pattern)
            if (seen.has(p)) continue
            seen.add(p)
            next.push({ pattern: p, label: d.label, category: d.category, color_scheme: d.color_scheme || "emerald" })
          }
          return { tags: dedupeStrategyTagsByPattern(next) }
        })
      }

      const classified: ClassifiedInput = {
        serviceClassifications: svcClassResult.results,
        expenseClassifications: expClassResult.results,
        discoveredTags,
        aiMetadata: aggregateRagMetadata(svcClassResult.results, expClassResult.results),
      }
      return { ok: true, acc: { ...acc, classified, discoveredTags } }
    } catch (error) {
      return { ok: false, error }
    }
  },
}

// ─── simulate ─────────────────────────────────────────────────────────────

/** Segundo passo do registry — calcula a simulação a partir do classify anterior. */
export const simulateStep: Step = {
  id: "simulate",
  uiStage: "simulation",
  async run(input, acc, ctx) {
    if (!acc.classified) {
      return { ok: false, error: new Error("[TribIA] simulate exige o `classified` de um passo anterior.") }
    }
    const classified = acc.classified
    try {
      const plgAuth = await resolvePlgAuth(ctx)
      const svcClassMap = mapByClientId(classified.serviceClassifications)
      const expClassMap = mapByClientId(classified.expenseClassifications)
      const redutorTrim = input.imobiliarioRedutorAjusteBrl?.trim() ?? ""

      const simResult = await simulate(
        {
          year: input.year,
          ...(input.companyRegime !== "regular" ? { company_regime: input.companyRegime } : {}),
          company_context: input.companyContext,
          ...(isImobiliarioRegime(input.companyRegime) && redutorTrim !== ""
            ? { imobiliario_redutor_ajuste_brl: redutorTrim }
            : {}),
          services: input.services.map((s) => ({
            description: s.description,
            amount: s.amount,
            iss_rate: s.iss_rate,
            regime_type: svcClassMap.get(s.id)?.regime_type ?? "padrao",
          })),
          expenses: input.expenses.map((e) => ({
            description: e.description,
            amount: e.amount,
            is_eligible: expClassMap.get(e.id)?.is_eligible ?? false,
            regime_type: expClassMap.get(e.id)?.regime_type ?? "padrao",
            legal_base: expClassMap.get(e.id)?.legal_base,
          })),
        },
        plgAuth,
      )

      // Efeitos gated na simulação inteira ter sucesso (como o onSuccess original).
      if (classified.discoveredTags.length > 0) {
        const { appendStrategyTagHighlightPatterns, setStrategyTagsDiscoveryMessage } = useTaxStore.getState()
        appendStrategyTagHighlightPatterns(classified.discoveredTags.map((d) => normalizeText(d.pattern)))
        setStrategyTagsDiscoveryMessage("Novo padrão integrado ao vocabulário TribIA para consultas futuras.")
        for (const d of classified.discoveredTags) {
          emitStrategyTagConfirmed({
            pattern_key: normalizeText(d.pattern),
            label_key: normalizeText(d.label).slice(0, 64),
          })
        }
      }

      const results: FormResults = {
        mode: "form",
        simulation: simResult,
        classifications: classified.expenseClassifications,
        expenses: input.expenses,
        ai_metadata: classified.aiMetadata,
        service_classifications: classified.serviceClassifications,
        meta: {
          createdAt: new Date().toISOString(),
          companyContext: input.companyContext,
          year: input.year,
          ...(input.companyId ? { companyId: input.companyId } : {}),
        },
      }
      return { ok: true, acc: { ...acc, results } }
    } catch (error) {
      return { ok: false, error }
    }
  },
}

// ─── recalc (simulate-only, sem reclassificar) ───────────────────────────────

export async function runRecalc(results: FormResults, ctx: StepCtx): Promise<MachineEvent> {
  try {
    const { year, companyContext, companyRegime, imobiliarioRedutorAjusteBrl, services, expenses } =
      useTaxStore.getState()
    const plgAuth = await resolvePlgAuth(ctx)
    const redutorTrim = imobiliarioRedutorAjusteBrl?.trim() ?? ""

    const svcClassMap = new Map(
      (results.service_classifications ?? []).map((c) => [c.client_id ?? c.description, c] as const),
    )
    const expClassMap = new Map(results.classifications.map((c) => [c.client_id ?? c.description, c] as const))

    const simulation = await simulate(
      {
        year,
        ...(companyRegime !== "regular" ? { company_regime: companyRegime } : {}),
        company_context: companyContext,
        ...(isImobiliarioRegime(companyRegime) && redutorTrim !== ""
          ? { imobiliario_redutor_ajuste_brl: redutorTrim }
          : {}),
        services: services.map((s) => ({
          description: s.description,
          amount: s.amount,
          iss_rate: s.iss_rate,
          regime_type: svcClassMap.get(s.id)?.regime_type ?? "padrao",
        })),
        expenses: expenses.map((e) => {
          const c = expClassMap.get(e.id) ?? expClassMap.get(e.description) ?? null
          const eff = getEffectiveExpenseSimulationFields(c)
          return {
            description: e.description,
            amount: e.amount,
            is_eligible: eff.is_eligible,
            regime_type: eff.regime_type,
            legal_base: c?.legal_base,
          }
        }),
      },
      plgAuth,
    )
    return { type: "RECALC_SUCCEEDED", simulation }
  } catch (error) {
    return { type: "RECALC_FAILED", error }
  }
}

// ─── persist (caminho único: initial | recalc | dossier) ────────────────────
//
// Mudança deliberada (FE-1, #1): todas as origens invalidam simulationRecords
// + plgQuota (o save pós-recalc original não invalidava nada). Mudança
// deliberada (FE-1, #2): erro de persist sempre chega a PERSIST_FAILED (log),
// nunca fica em catch{} silencioso como o recalc original.

export async function runPersist(
  origin: PersistOrigin,
  results: FormResults,
  extra: { discoveredTags?: StrategyTag[]; reportBrand?: ReportBrand | null },
  ctx: StepCtx,
): Promise<MachineEvent> {
  if (!ctx.userId) return { type: "PERSIST_FAILED", error: new Error("Sem usuário autenticado.") }
  try {
    const token = await ctx.getToken()
    if (!token) return { type: "PERSIST_FAILED", error: new Error("Sem token de sessão.") }

    const store = useTaxStore.getState()
    const year = results.meta?.year ?? results.simulation.year
    const companyContext = results.meta?.companyContext ?? store.companyContext

    const payload = buildSimulationRecordCreatePayload(
      {
        year,
        companyContext,
        companyRegime: store.companyRegime,
        services: store.services,
        expenses: results.expenses,
        formResults: results,
      },
      {
        useInitialExpenseEligibility: origin === "initial",
        discoveredTags: origin === "initial" ? extra.discoveredTags : undefined,
        reportBrand: origin === "dossier" ? extra.reportBrand : undefined,
      },
    )
    const created = await saveSimulationRecord(token, ctx.userId, payload)
    ctx.queryClient.invalidateQueries({ queryKey: queryKeys.simulationRecords.all })
    ctx.queryClient.invalidateQueries({ queryKey: queryKeys.plgQuota.all })
    return { type: "PERSIST_SUCCEEDED", recordId: created.id }
  } catch (error) {
    console.error("[TribIA] Falha ao persistir histórico no servidor:", error)
    return { type: "PERSIST_FAILED", error }
  }
}
