// Barrel público da feature import (FE-3). app/ e features/simulation só
// consomem daqui — nunca de features/import/** diretamente (lint de fronteira).
import { IMPORTERS } from "./registry"
import { FileDropZone } from "./components/file-drop-zone"
import type { ImporterPanelEntry, ImporterPickerProps } from "@/lib/importer-contract"

/** app/dashboard/page.tsx: lista de entries a injetar em SimulationDashboard.importerEntries. */
export function getImporterPanelEntries(): ImporterPanelEntry[] {
  return IMPORTERS.map((importer) => ({
    id: importer.id,
    label: importer.label,
    render: (props: ImporterPickerProps) => {
      const Picker = importer.Picker
      return Picker ? <Picker {...props} /> : <FileDropZone importer={importer} onApplied={props.onApplied} />
    },
  }))
}
