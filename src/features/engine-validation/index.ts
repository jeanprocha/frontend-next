// Barrel público da feature engine-validation (W7/PR 6). app/ só consome
// daqui — nunca de features/engine-validation/** diretamente.
export { useEngineValidation, type UseEngineValidationResult } from "@/lib/use-engine-validation"
export { motorValidadoSeloSection } from "./sections/motor-validado-selo"
