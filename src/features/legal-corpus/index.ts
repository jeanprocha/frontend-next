// Barrel público da feature legal-corpus (FE-3, PR 3e). app/ e shell/ (via
// slot) só consomem daqui — nunca de features/legal-corpus/** diretamente.
export { LegalVersionIndicator, type LegalVersionIndicatorProps } from "./components/legal-version-indicator"
export { useLawCorpus, type UseLawCorpusResult } from "./use-law-corpus"
