import { describe, expect, it } from "vitest"
import { createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import {
  ehRotaClientes,
  ehRotaSimulacoes,
  ehSuperficieSimulador,
  PROTECTED_ROUTE_PATTERNS,
} from "./routes"

// Blind spot do bypass E2E da FE-0: sob NEXT_PUBLIC_E2E_AUTH_BYPASS o proxy é
// passthrough total, então nenhum E2E consegue detectar uma rota nova
// esquecida no matcher. Este teste unitário é a única rede de segurança.
describe("PROTECTED_ROUTE_PATTERNS (proxy.ts)", () => {
  const isProtected = createRouteMatcher([...PROTECTED_ROUTE_PATTERNS])
  const req = (p: string) => new NextRequest(`http://localhost${p}`)

  it.each([
    "/clientes",
    "/clientes/",
    "/clientes/abc-123",
    "/clientes/abc-123/simulacoes/rec-1",
    "/simulador",
    "/simulador/",
    "/simulacoes",
    "/simulacoes/",
  ])("%s é protegida", (path) => {
    expect(isProtected(req(path))).toBe(true)
  })

  it.each([
    "/",
    "/privacidade",
    "/report/abc-123",
    "/api/public/simulation-records/abc-123",
  ])("%s permanece pública", (path) => {
    expect(isProtected(req(path))).toBe(false)
  })
})

describe("ehSuperficieSimulador", () => {
  it.each(["/simulador", "/simulador/", "/clientes/abc", "/clientes/abc/simulacoes/rec-1"])(
    "%s é superfície do simulador",
    (path) => {
      expect(ehSuperficieSimulador(path)).toBe(true)
    },
  )

  it.each(["/clientes", "/clientes/", "/simulacoes", "/", "/privacidade"])(
    "%s NÃO é superfície do simulador",
    (path) => {
      expect(ehSuperficieSimulador(path)).toBe(false)
    },
  )
})

describe("ehRotaClientes", () => {
  it.each(["/clientes", "/clientes/abc", "/clientes/abc/simulacoes/rec-1"])(
    "%s é rota de clientes",
    (path) => {
      expect(ehRotaClientes(path)).toBe(true)
    },
  )

  it.each(["/simulador", "/simulacoes", "/"])("%s NÃO é rota de clientes", (path) => {
    expect(ehRotaClientes(path)).toBe(false)
  })
})

describe("ehRotaSimulacoes", () => {
  it("/simulacoes é rota de simulações", () => {
    expect(ehRotaSimulacoes("/simulacoes")).toBe(true)
  })

  it.each(["/clientes", "/simulador", "/"])("%s NÃO é rota de simulações", (path) => {
    expect(ehRotaSimulacoes(path)).toBe(false)
  })
})
