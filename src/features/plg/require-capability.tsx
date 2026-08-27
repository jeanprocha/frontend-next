"use client"

import type { ReactNode } from "react"
import { useCapability } from "./use-capability"
import type { CapabilityName } from "./capabilities"

/** Renderiza `children` apenas quando `cap` está activa no plano actual; caso contrário, `fallback`. */
export function RequireCapability({
  cap,
  fallback = null,
  children,
}: {
  cap: CapabilityName
  fallback?: ReactNode
  children: ReactNode
}) {
  const allowed = useCapability(cap)
  return <>{allowed ? children : fallback}</>
}
