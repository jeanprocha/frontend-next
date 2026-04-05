"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { classifyBatch, saveSimulationRecord, simulate } from "@/lib/api"
import {
  useTaxStore,
  type CompanyRegimeOption,
  isImobiliarioRegime,
} from "@/store/useTaxStore"
import type { FormExpense, FormService } from "@/types/api"

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
  return companyContext
}

export function useSimulationMutation() {
  const { setResults: setFormResults } = useTaxStore()
  const { userId, getToken } = useAuth()
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
        ),
        classifyBatch(
          expenses.map((e) => ({
            client_id: e.id,
            description: e.description,
            context: ctxForClassify,
          })),
        ),
      ])

      const svcClassMap = mapByClientId(svcClassResult.results)
      const expClassMap = mapByClientId(expClassResult.results)

      // Passo 2: motor Go calcula impacto com regime_type por serviço e créditos corretos
      const redutorTrim = imobiliarioRedutorAjusteBrl?.trim() ?? ""
      const simResult = await simulate({
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
      })

      return {
        simulation: simResult,
        classifications: expClassResult.results,
        expenses,
      }
    },
    onSuccess: async (data, variables) => {
      setFormResults({
        mode: "form",
        ...data,
        meta: {
          createdAt: new Date().toISOString(),
          companyContext: variables.companyContext,
          year: variables.year,
        },
      })

      if (!userId) return

      try {
        const token = await getToken()
        if (!token) {
          console.error("[TribIA] Sem token de sessão para gravar histórico.")
          return
        }
        await saveSimulationRecord(token, {
          company_context: variables.companyContext,
          year: variables.year,
          simulation: data.simulation,
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
      } catch (e) {
        console.error("[TribIA] Falha ao persistir histórico no servidor:", e)
      }
    },
  })
}
