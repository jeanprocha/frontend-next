/**
 * Fonte única de rotas do app (FE-4). Nenhum literal "/clientes"|"/simulador"|
 * "/simulacoes" deveria existir fora daqui — camada base (como lib/store/
 * types/constants), importável de qualquer lugar sem violar o lint de
 * fronteira.
 */
export const ROTAS = {
  inicio: "/",
  clientes: "/clientes",
  cliente: (companyId: string) => `/clientes/${companyId}`,
  clienteSimulacao: (companyId: string, recordId: string) =>
    `/clientes/${companyId}/simulacoes/${recordId}`,
  simulador: "/simulador",
  simulacoes: "/simulacoes",
  relatorio: (recordId: string) => `/report/${recordId}`,
  privacidade: "/privacidade",
} as const

/**
 * Padrões do createRouteMatcher (proxy.ts). A rota legada do dashboard não
 * entra aqui: os redirects em next.config.ts rodam ANTES do proxy — o
 * destino já cai numa destas rotas protegidas.
 */
export const PROTECTED_ROUTE_PATTERNS = [
  "/clientes(.*)",
  "/simulador(.*)",
  "/simulacoes(.*)",
] as const

/** Superfícies onde o SimulationDashboard está montado — avulso ou workspace do cliente (com ou sem registo aberto). */
export function ehSuperficieSimulador(pathname: string): boolean {
  if (pathname === ROTAS.simulador || pathname === `${ROTAS.simulador}/`) return true
  return /^\/clientes\/[^/]+(\/simulacoes\/[^/]+)?\/?$/.test(pathname)
}

/** Carteira (lista) ou dentro do workspace de um cliente. */
export function ehRotaClientes(pathname: string): boolean {
  return pathname === ROTAS.clientes || pathname.startsWith(`${ROTAS.clientes}/`)
}

/** Histórico global de simulações. */
export function ehRotaSimulacoes(pathname: string): boolean {
  return pathname === ROTAS.simulacoes || pathname.startsWith(`${ROTAS.simulacoes}/`)
}
