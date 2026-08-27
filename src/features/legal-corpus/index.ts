// Barrel público da feature legal-corpus (FE-3, PR 3e). app/ e shell/ (via
// slot) só consomem daqui — nunca de features/legal-corpus/** diretamente.
// useLawCorpus vive em lib/use-law-corpus.ts (promovido na PR 10 — outras
// features também precisam dele, e feature→feature é proibido); reexportado
// aqui por compatibilidade e porque LegalVersionIndicator/baseLegalSeloSection
// são donos legítimos da UI que o consome.
export { LegalVersionIndicator, type LegalVersionIndicatorProps } from "./components/legal-version-indicator"
export { useLawCorpus, type UseLawCorpusResult } from "@/lib/use-law-corpus"
export { baseLegalSeloSection } from "./sections/base-legal-selo"
