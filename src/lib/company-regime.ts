export type CompanyRegimeOption =
  | "regular"
  | "mei"
  | "simples_puro"
  | "simples_hibrido"
  | "diferenciado_60"
  | "aliquota_zero"
  | "exportadora"
  | "entidade_imune"
  | "imobiliario_venda"
  | "imobiliario_aluguel"
  | "prof_liberal"

export function isImobiliarioRegime(r: CompanyRegimeOption): boolean {
  return r === "imobiliario_venda" || r === "imobiliario_aluguel"
}
