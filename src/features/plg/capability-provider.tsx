"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { TribiaPlgCapabilities } from "./capabilities"

const CapabilityOverrideContext = createContext<TribiaPlgCapabilities | null>(null)

/**
 * Sobrepõe as capacidades derivadas do plano do utilizador (ex.: dossié
 * público, onde o gating já ocorreu na geração do link — ver
 * PUBLIC_REPORT_CAPABILITIES em capabilities.ts).
 */
export function CapabilityProvider({
  value,
  children,
}: {
  value: TribiaPlgCapabilities
  children: ReactNode
}) {
  return (
    <CapabilityOverrideContext.Provider value={value}>
      {children}
    </CapabilityOverrideContext.Provider>
  )
}

export function useCapabilityOverride(): TribiaPlgCapabilities | null {
  return useContext(CapabilityOverrideContext)
}
