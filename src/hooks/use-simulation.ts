"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  classifyBatch,
  saveSimulationRecord,
  simulate,
  type ClassifySimulatePlgOpts,
} from "@/lib/api"
import {
  useTaxStore,
  type CompanyRegimeOption,
  isImobiliarioRegime,
} from "@/store/useTaxStore"
import { aggregateRagMetadata } from "@/lib/rag-metadata"
import { dedupeStrategyTagsByPattern, normalizeText } from "@/lib/strategy-tags-match"
import { emitStrategyTagConfirmed } from "@/lib/strategy-tags-telemetry"
import type { FormExpense, FormService, StrategyTag, StrategyTagsListResponse } from "@/types/api"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"

// Payload recebido via mutate() — não acoplado ao Zustand internamente,
// o que torna o hook testável e reutilizável em outros contextos.
export interface SimulationPayload {
  year: number
  services: FormService[]
  expenses: FormExpense[]
  companyContext: string
  companyRegime?: CompanyRegimeOption
  imobiliarioRedutorAjusteBrl?: string
}

const PREFIX_CLASSIFY_DIFERENCIADO_60 =
  "[Perfil simulador: empresa enquadrável no regime diferenciado da LC 68/2024 (saúde, educação, cultura; Art. 131). " +
  "Avalie com rigor se cada item é coerente com essa atividade e elegível a crédito; use só trechos da lei recuperados como base.]\n\n"

const PREFIX_CLASSIFY_ALIQUOTA_ZERO =
  "[Perfil simulador: company_regime aliquota_zero — operação voltada à Cesta Básica Nacional / alíquota zero CBS+IBS na saída (LC 68/2024, Anexo I). " +
  "Para cada receita ou despesa, verifique se o item é literalmente coberto pelos trechos recuperados; arroz, feijão etc. podem ser reduzido_zero se a lei no contexto assim indicar; " +
  "itens fora da cesta (ex.: luxo) devem ser regime_type padrao. Use apenas trechos da lei recuperados como base.]\n\n"

const PREFIX_CLASSIFY_IMOBILIARIO =
  "[Perfil simulador: setor imobiliário (incorporação, venda ou locação — LC 68/2024, ilustrativo). " +
  "Priorize elegibilidade a crédito IBS/CBS em materiais de construção (cimento, aço, etc.), serviços de empreiteira e subempreitada usados na atividade, " +
  "sempre com base nos trechos recuperados da lei; não invente regras.]\n\n"

const PREFIX_CLASSIFY_PROF_LIBERAL =
  "[Perfil simulador: company_regime prof_liberal — sociedade ou escritório de profissões regulamentadas (advocacia, engenharia, contabilidade, arquitetura; ilustrativo). " +
  "Priorize elegibilidade a crédito em software de gestão e ERP jurídico, assinaturas digitais, bases de dados profissionais, certificações e locação de sala/escritório alinhados à atividade-fim; " +
  "use apenas trechos da lei recuperados como base.]\n\n"

const PREFIX_CLASSIFY_EXPORTADORA =
  "[Perfil simulador: company_regime exportadora — operação com foco em mercado externo (exportação, ilustrativo). " +
  "Priorize análise de elegibilidade a crédito IBS/CBS em fretes internacionais, armazenagem portuária ou logística, despachante aduaneiro e insumos ligados à cadeia de exportação, " +
  "sempre com base exclusiva nos trechos da LC 68/2024 recuperados abaixo; não afirme benefício sem âncora no texto.]\n\n"

const PREFIX_CLASSIFY_ENTIDADE_IMUNE =
  "[Perfil simulador: company_regime entidade_imune — entidade imune ou ISFL (ilustrativo). " +
  "No modelo TribIA a entidade não apropria créditos de IBS/CBS nas compras; avalie elegibilidade de forma conservadora e ancore qualquer conclusão nos trechos recuperados da lei; " +
  "não prometa crédito sem suporte explícito no contexto.]\n\n"

function mapByClientId<T extends { client_id?: string; description: string }>(
  results: T[],
): Map<string, T> {
  const m = new Map<string, T>()
  for (const r of results) {
    const key = (r.client_id && r.client_id.trim()) || r.description
    m.set(key, r)
  }
  return m
}

function classificationContextForAI(
  companyContext: string,
  companyRegime: CompanyRegimeOption,
): string {
  if (companyRegime === "diferenciado_60") {
    return PREFIX_CLASSIFY_DIFERENCIADO_60 + companyContext
  }
  if (companyRegime === "aliquota_zero") {
    return PREFIX_CLASSIFY_ALIQUOTA_ZERO + companyContext
  }
  if (isImobiliarioRegime(companyRegime)) {
    return PREFIX_CLASSIFY_IMOBILIARIO + companyContext
  }
  if (companyRegime === "prof_liberal") {
    return PREFIX_CLASSIFY_PROF_LIBERAL + companyContext
  }
  if (companyRegime === "exportadora") {
    return PREFIX_CLASSIFY_EXPORTADORA + companyContext
  }
  if (companyRegime === "entidade_imune") {
    return PREFIX_CLASSIFY_ENTIDADE_IMUNE + companyContext
  }
  return companyContext
}

function mergeDiscoveredStrategyTags(
  a: { discovered_tags?: StrategyTag[] },
  b: { discovered_tags?: StrategyTag[] },
): StrategyTag[] {
  const m = new Map<string, StrategyTag>()
  for (const d of [...(a.discovered_tags ?? []), ...(b.discovered_tags ?? [])]) {
    const p = normalizeText(d.pattern)
    if (!p) continue
    m.set(p, {
      ...d,
      pattern: p,
      color_scheme: d.color_scheme?.trim() || "emerald",
    })
  }
  return [...m.values()]
}

export function useSimulationMutation() {
  const { setResults: setFormResults } = useTaxStore()
  const { userId, getToken } = useAuth()
  const plgTier = useTribiaPlgTier()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ["tax-simulation"],
    mutationFn: async ({
      year,
      services,
      expenses,
      companyContext,
      companyRegime = "regular",
      imobiliarioRedutorAjusteBrl,
    }: SimulationPayload) => {
      const token = await getToken()
      const plgAuth: ClassifySimulatePlgOpts | null =
        token && userId
          ? { token, userId, plan: plgTier }
          : null

      const ctxForClassify = classificationContextForAI(companyContext, companyRegime)
      // Passo 1: IA classifica serviços e despesas em paralelo via RAG + LLM (LC 68/2024).
      // Serviços → extrai regime_type (determina alíquota efetiva CBS/IBS no motor Go).
      // Despesas → extrai is_eligible + regime_type (para créditos e badge de regime).
      const [svcClassResult, expClassResult] = await Promise.all([
        classifyBatch(
          services.map((s) => ({
            client_id: s.id,
            description: s.description,
            context: ctxForClassify,
          })),
          5,
          plgAuth,
        ),
        classifyBatch(
          expenses.map((e) => ({
            client_id: e.id,
            description: e.description,
            context: ctxForClassify,
          })),
          5,
          plgAuth,
        ),
      ])

      const svcClassMap = mapByClientId(svcClassResult.results)
      const expClassMap = mapByClientId(expClassResult.results)

      const discoveredStrategyTags = mergeDiscoveredStrategyTags(svcClassResult, expClassResult)
      if (discoveredStrategyTags.length > 0) {
        queryClient.setQueryData<StrategyTagsListResponse>(["strategy-tags"], (old) => {
          const cur = old?.tags ?? []
          const seen = new Set(cur.map((t) => normalizeText(t.pattern)))
          const next = [...cur]
          for (const d of discoveredStrategyTags) {
            const p = normalizeText(d.pattern)
            if (seen.has(p)) continue
            seen.add(p)
            next.push({
              pattern: p,
              label: d.label,
              category: d.category,
              color_scheme: d.color_scheme || "emerald",
            })
          }
          return { tags: dedupeStrategyTagsByPattern(next) }
        })
      }

      // Passo 2: motor Go calcula impacto com regime_type por serviço e créditos corretos
      const redutorTrim = imobiliarioRedutorAjusteBrl?.trim() ?? ""
      const simResult = await simulate(
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
          expenses: expenses.map((e) => ({
            description: e.description,
            amount: e.amount,
            is_eligible: expClassMap.get(e.id)?.is_eligible ?? false,
            regime_type: expClassMap.get(e.id)?.regime_type ?? "padrao",
          })),
        },
        plgAuth,
      )

      const ai_metadata = aggregateRagMetadata(
        svcClassResult.results,
        expClassResult.results,
      )

      return {
        simulation: simResult,
        classifications: expClassResult.results,
        expenses,
        discoveredStrategyTags,
        ai_metadata,
      }
    },
    onSuccess: async (data, variables) => {
      setFormResults({
        mode: "form",
        simulation: data.simulation,
        classifications: data.classifications,
        expenses: data.expenses,
        ai_metadata: data.ai_metadata ?? null,
        meta: {
          createdAt: new Date().toISOString(),
          companyContext: variables.companyContext,
          year: variables.year,
        },
      })

      if (data.discoveredStrategyTags.length > 0) {
        const { appendStrategyTagHighlightPatterns, setStrategyTagsDiscoveryMessage } =
          useTaxStore.getState()
        appendStrategyTagHighlightPatterns(
          data.discoveredStrategyTags.map((d) => normalizeText(d.pattern)),
        )
        setStrategyTagsDiscoveryMessage(
          "Novo padrão integrado ao vocabulário TribIA para consultas futuras.",
        )
        for (const d of data.discoveredStrategyTags) {
          emitStrategyTagConfirmed({
            pattern_key: normalizeText(d.pattern),
            label_key: normalizeText(d.label).slice(0, 64),
          })
        }
      }

      if (!userId) return

      try {
        const sessionToken = await getToken()
        if (!sessionToken) {
          console.error("[TribIA] Sem token de sessão para gravar histórico.")
          return
        }
        await saveSimulationRecord(sessionToken, userId, {
          company_context: variables.companyContext,
          company_regime: variables.companyRegime ?? "regular",
          year: variables.year,
          simulation: {
            ...data.simulation,
            company_regime: variables.companyRegime ?? "regular",
          },
          services: variables.services.map((s) => ({
            description: s.description,
            amount: s.amount,
            iss_rate: s.iss_rate,
          })),
          expenses: variables.expenses.map((e) => ({
            description: e.description,
            amount: e.amount,
            is_eligible:
              data.classifications.find((c) => c.client_id === e.id)?.is_eligible ??
              data.classifications.find((c) => c.description === e.description)
                ?.is_eligible ??
              false,
          })),
          classifications: data.classifications,
        })
        await queryClient.invalidateQueries({
          queryKey: ["simulation-records", userId],
        })
        await queryClient.invalidateQueries({ queryKey: ["plg-quota", userId] })
      } catch (e) {
        console.error("[TribIA] Falha ao persistir histórico no servidor:", e)
      }
    },
  })
}
