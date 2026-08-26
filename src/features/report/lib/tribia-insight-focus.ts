/** True quando o insight (gerado no POST para `simulationRunYear`) não coincide com o ano mostrado nos cartões (`resultYear`). */
export function insightYearMismatch(resultYear: number, simulationRunYear?: number): boolean {
  return (
    simulationRunYear != null &&
    Number.isFinite(simulationRunYear) &&
    simulationRunYear !== resultYear
  )
}
