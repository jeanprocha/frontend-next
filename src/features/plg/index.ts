// Barrel público da feature plg — única feature transversal (ver eslint.config.mjs:
// exceção `!@/features/plg` nos grupos de components/, shell/, hooks/ e features/).
// Outras camadas só importam daqui — nunca de features/plg/** directamente.
export { TribiaPlanProvider } from "./plan-provider"
export { CapabilityProvider } from "./capability-provider"
export { RequireCapability } from "./require-capability"
export {
  useCapability,
  usePlgCapabilities,
  useTribiaPlgTier,
  useTribiaBranding,
} from "./use-capability"
export { usePlgQuota } from "./use-plg-quota"
export { getPlgCapabilities, PUBLIC_REPORT_CAPABILITIES } from "./capabilities"
export type { TribiaPlgTier, TribiaPlgCapabilities, CapabilityName } from "./capabilities"

export { PlgLimitMeter } from "./components/plg-limit-meter"
export { PlgUpgradeDialog, type PlgUpgradeFeature } from "./components/plg-upgrade-dialog"
export { PlgLimitDialogHost } from "./components/plg-limit-dialog-host"
export { TribiaPlanBadge } from "./components/tribia-plan-badge"
