import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, setPlgLimitListener, throwApiError, tribiaFetch, type PlgLimitErrorInfo } from "./http"

function res(status: number): Response {
  return { status } as Response
}

afterEach(() => {
  setPlgLimitListener(null)
})

describe("tribiaFetch — harden de rede (C5)", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  it("mapeia TypeError (rede/CORS) para ApiError em voz de parecer, sem 'Failed to fetch' cru", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))

    let thrown: unknown
    try {
      await tribiaFetch("https://motor.invalido/simulations")
    } catch (e) {
      thrown = e
    }

    expect(thrown).toBeInstanceOf(ApiError)
    const err = thrown as ApiError
    expect(err.message).not.toMatch(/failed to fetch/i)
    expect(err.message).toBe(
      "Não foi possível contactar o motor de cálculo. Verifique a conexão e tente novamente.",
    )
  })

  it("repassa uma Response normal (2xx–5xx) intacta — não mascara erros HTTP", async () => {
    const httpRes = res(403)
    globalThis.fetch = vi.fn().mockResolvedValue(httpRes)

    const result = await tribiaFetch("https://motor.valido/plg/quota")
    expect(result).toBe(httpRes)
  })

  it("relança erros que não são de rede (ex.: bug de programação) sem reescrever a mensagem", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new RangeError("algo não relacionado a rede"))

    await expect(tribiaFetch("https://motor.valido/plg/quota")).rejects.toBeInstanceOf(RangeError)
  })
})

describe("throwApiError — interceptor 403 PLG", () => {
  it("notifica o listener com os campos parseados e lança o ApiError de sempre", () => {
    const received: PlgLimitErrorInfo[] = []
    setPlgLimitListener((info) => received.push(info))

    let thrown: unknown
    try {
      throwApiError(
        res(403),
        { error: "Limite atingido", code: "quota_exceeded", limit: 5, used: 6, plan: "free", request_id: "req-1" },
        "fallback",
      )
    } catch (e) {
      thrown = e
    }

    expect(thrown).toBeInstanceOf(ApiError)
    const err = thrown as ApiError
    expect(err.message).toBe("Limite atingido")
    expect(err.code).toBe("quota_exceeded")
    expect(err.limit).toBe(5)
    expect(err.used).toBe(6)
    expect(err.plan).toBe("free")
    expect(err.requestId).toBe("req-1")

    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({
      message: "Limite atingido",
      code: "quota_exceeded",
      status: 403,
      limit: 5,
      used: 6,
      plan: "free",
      requestId: "req-1",
    })
  })

  it("403 sem `code` no corpo não notifica o listener", () => {
    const listener = vi.fn()
    setPlgLimitListener(listener)

    expect(() => throwApiError(res(403), { error: "Proibido" }, "fallback")).toThrow(ApiError)
    expect(listener).not.toHaveBeenCalled()
  })

  it("erro não-403 não notifica o listener", () => {
    const listener = vi.fn()
    setPlgLimitListener(listener)

    expect(() => throwApiError(res(500), { error: "Falha interna" }, "fallback")).toThrow(ApiError)
    expect(listener).not.toHaveBeenCalled()
  })

  it("um listener que lança não mascara o ApiError original", () => {
    setPlgLimitListener(() => {
      throw new Error("listener quebrado")
    })

    expect(() => throwApiError(res(403), { code: "quota_exceeded" }, "fallback")).toThrow(ApiError)
  })

  it("setPlgLimitListener(null) desregistra", () => {
    const listener = vi.fn()
    setPlgLimitListener(listener)
    setPlgLimitListener(null)

    expect(() => throwApiError(res(403), { code: "quota_exceeded" }, "fallback")).toThrow(ApiError)
    expect(listener).not.toHaveBeenCalled()
  })
})
