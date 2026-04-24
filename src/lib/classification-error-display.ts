/**
 * Formatação de `ClassificationItem.error` para células de UI.
 * Erros de parse JSON/LLM são técnicos — não devem ocupar a coluna «Base Legal» em bruto.
 */

export function isClassifierTechnicalParseError(message: string): boolean {
  const m = message.toLowerCase()
  if (m.includes("parse resposta llm")) return true
  if (m.includes("classifier:") && m.includes("parse")) return true
  if (m.includes("invalid character") && (m.includes("json") || m.includes("top-level"))) return true
  if (m.includes("unexpected end of json") || m.includes("unexpected token")) return true
  return false
}

/** Texto curto na tabela; o valor completo pode ir em `title` para suporte / debug. */
export function classificationErrorCellText(message: string): string {
  const t = message.trim()
  if (!t) return ""
  if (isClassifierTechnicalParseError(t)) {
    return "A resposta automática veio em formato inválido. Reclassifique a linha ou repita a simulação."
  }
  if (t.length > 220) {
    return `${t.slice(0, 217)}…`
  }
  return t
}
