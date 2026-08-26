import type { ReactNode } from "react"
// eslint-disable-next-line no-restricted-imports -- herança FE-0: lib→components/tax; resolver na FE-2
import { TaxTerm } from "@/components/tax/tax-term"
import { TAX_GLOSSARY, type TaxGlossaryTerm } from "@/constants/tax-glossary"

const SORTED_TERMS = Object.keys(TAX_GLOSSARY).sort(
  (a, b) => b.length - a.length,
) as TaxGlossaryTerm[]

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Limites Unicode: evita que `\b` parta palavras com acentos (ex.: "Não-..."). */
function buildGlossaryRegex(): RegExp {
  const escaped = SORTED_TERMS.map(escapeRegex)
  const body = escaped.join("|")
  return new RegExp(
    `(?<![\\p{L}\\p{M}0-9])(${body})(?![\\p{L}\\p{M}0-9])`,
    "giu",
  )
}

const GLOSSARY_REGEX = buildGlossaryRegex()

export function parseTaxTerms(text: string): ReactNode {
  if (!text) return text

  const parts = text.split(GLOSSARY_REGEX)

  return (
    <>
      {parts.map((part, i) => {
        const termKey = SORTED_TERMS.find(
          (t) => t.toLowerCase() === part.toLowerCase(),
        )

        if (termKey) {
          return (
            <TaxTerm key={`${termKey}-${i}`} term={termKey}>
              {part}
            </TaxTerm>
          )
        }

        return part
      })}
    </>
  )
}
