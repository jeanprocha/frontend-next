import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { RequireCapability } from "./require-capability"
import { CapabilityProvider } from "./capability-provider"
import { getPlgCapabilities } from "./capabilities"

describe("RequireCapability", () => {
  it("renderiza children quando a capacidade está activa", () => {
    render(
      <CapabilityProvider value={getPlgCapabilities("premium")}>
        <RequireCapability cap="legalOpinionTab">
          <p>Parecer jurídico</p>
        </RequireCapability>
      </CapabilityProvider>,
    )
    expect(screen.getByText("Parecer jurídico")).toBeInTheDocument()
  })

  it("renderiza o fallback quando a capacidade está desligada", () => {
    render(
      <CapabilityProvider value={getPlgCapabilities("free")}>
        <RequireCapability cap="legalOpinionTab" fallback={<p>Bloqueado</p>}>
          <p>Parecer jurídico</p>
        </RequireCapability>
      </CapabilityProvider>,
    )
    expect(screen.queryByText("Parecer jurídico")).not.toBeInTheDocument()
    expect(screen.getByText("Bloqueado")).toBeInTheDocument()
  })

  it("sem fallback explícito, não renderiza nada quando a capacidade está desligada", () => {
    const { container } = render(
      <CapabilityProvider value={getPlgCapabilities("free")}>
        <RequireCapability cap="legalOpinionTab">
          <p>Parecer jurídico</p>
        </RequireCapability>
      </CapabilityProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
