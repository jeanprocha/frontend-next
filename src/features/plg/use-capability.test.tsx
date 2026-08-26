import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { CapabilityProvider } from "./capability-provider"
import { useCapability, usePlgCapabilities } from "./use-capability"
import { getPlgCapabilities } from "./capabilities"

function Probe() {
  const compareAB = useCapability("compareAB")
  const cap = usePlgCapabilities()
  return (
    <div>
      <span data-testid="compareAB">{String(compareAB)}</span>
      <span data-testid="rayxFull">{String(cap.rayxFull)}</span>
    </div>
  )
}

describe("useCapability / usePlgCapabilities", () => {
  it("sem CapabilityProvider, reflecte o plano real (fallback free sem TribiaPlanProvider)", () => {
    render(<Probe />)
    expect(screen.getByTestId("compareAB")).toHaveTextContent("false")
    expect(screen.getByTestId("rayxFull")).toHaveTextContent("false")
  })

  it("com CapabilityProvider, a sobreposição vence mesmo com o plano real em free", () => {
    render(
      <CapabilityProvider value={getPlgCapabilities("premium")}>
        <Probe />
      </CapabilityProvider>,
    )
    expect(screen.getByTestId("compareAB")).toHaveTextContent("true")
    expect(screen.getByTestId("rayxFull")).toHaveTextContent("true")
  })
})
