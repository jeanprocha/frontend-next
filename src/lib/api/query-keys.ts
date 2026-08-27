/**
 * Convenção única de query keys: [domínio, entidade, ...params]. Invalidação
 * sempre por `.all` (prefixo) — impossível divergir entre call sites que
 * escrevem a mesma key à mão em arquivos diferentes.
 */
type UserId = string | null | undefined

export const queryKeys = {
  companies: {
    all: ["companies"] as const,
    list: (userId: UserId, plan: string) => ["companies", "list", userId, plan] as const,
  },
  plgQuota: {
    all: ["plg-quota"] as const,
    forUser: (userId: UserId, plan: string) => ["plg-quota", "quota", userId, plan] as const,
  },
  simulationRecords: {
    all: ["simulation-records"] as const,
    list: (userId: UserId, limit: number, companyId?: string) =>
      ["simulation-records", "list", userId, limit, companyId ?? "todas"] as const,
    /** FE-4: getSimulationRecord passa a rodar dentro do TanStack Query no workspace do cliente. */
    detail: (userId: UserId, recordId: string) => ["simulation-records", "detail", userId, recordId] as const,
  },
  strategyTags: {
    all: ["strategy-tags"] as const,
  },
  lawCorpus: {
    all: ["law-corpus"] as const,
  },
  engineValidation: {
    all: ["engine-validation"] as const,
  },
}
