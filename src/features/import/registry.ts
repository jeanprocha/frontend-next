// Registry canónico de importers (FE-3, PR 3c) — o dashboard não conhece
// "csv"/"xml-nfe" por nome, só compõe as entries deste array via barrel
// (index.tsx). Um importer novo é UMA linha aqui, mais a sua implementação
// em importers/ — nada em features/simulation ou app/ muda.
import { csvImporter } from "./importers/csv"
import type { ImporterDefinition } from "@/lib/importer-contract"

export const IMPORTERS: readonly ImporterDefinition[] = [csvImporter]
