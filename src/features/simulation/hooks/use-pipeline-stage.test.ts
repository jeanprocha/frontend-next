import { describe, expect, it } from "vitest"
import type { FormExpense, FormService } from "@/types/api"
import { resolvePipelineStage, type UsePipelineStageInput } from "./use-pipeline-stage"

const emptySvc: FormService = {
  id: "s0",
  description: "",
  amount: "",
  iss_rate: "0",
}
const emptyExp: FormExpense = { id: "e0", description: "", amount: "" }
const validSvc: FormService = {
  id: "s1",
  description: "SaaS",
  amount: "1000",
  iss_rate: "5",
}
const validExp: FormExpense = { id: "e1", description: "Cloud", amount: "100" }

function base(over: Partial<UsePipelineStageInput> = {}): UsePipelineStageInput {
  return {
    machineStatus: "idle",
    runningUiStage: null,
    services: [],
    expenses: [],
    ...over,
  }
}

describe("resolvePipelineStage", () => {
  describe("prioridade 1 — verdict", () => {
    it("retorna verdict quando a máquina está ready", () => {
      expect(resolvePipelineStage(base({ machineStatus: "ready" }))).toBe("verdict")
    })

    it("não retorna verdict enquanto running, mesmo com serviços/despesas preenchidos (precedência do passo real)", () => {
      expect(
        resolvePipelineStage(
          base({ machineStatus: "running", runningUiStage: "simulation", services: [validSvc], expenses: [validExp] }),
        ),
      ).toBe("simulation")
    })
  })

  describe("prioridade 2 — running reflete o uiStage do passo real", () => {
    it("retorna o uiStage do passo em execução (ex.: 'classification' durante o classify)", () => {
      expect(resolvePipelineStage(base({ machineStatus: "running", runningUiStage: "classification" }))).toBe(
        "classification",
      )
    })

    it("retorna 'simulation' durante o passo simulate", () => {
      expect(resolvePipelineStage(base({ machineStatus: "running", runningUiStage: "simulation" }))).toBe(
        "simulation",
      )
    })

    it("cai em 'simulation' se runningUiStage vier null (rede de segurança, não deveria acontecer com o registry real)", () => {
      expect(resolvePipelineStage(base({ machineStatus: "running", runningUiStage: null }))).toBe("simulation")
    })
  })

  describe("prioridade 3 — classification (fora de running/ready)", () => {
    it("retorna classification no form com ≥1 serviço e ≥1 despesa válidos, sem resultados", () => {
      expect(
        resolvePipelineStage(base({ machineStatus: "idle", services: [validSvc], expenses: [validExp] })),
      ).toBe("classification")
    })

    it("não entra em classification só com serviços válidos", () => {
      expect(
        resolvePipelineStage(base({ machineStatus: "idle", services: [validSvc], expenses: [emptyExp] })),
      ).toBe("context")
    })

    it("não entra em classification só com despesas válidas", () => {
      expect(
        resolvePipelineStage(base({ machineStatus: "idle", services: [emptySvc], expenses: [validExp] })),
      ).toBe("context")
    })
  })

  describe("default — context", () => {
    it("form vazio e máquina idle permanece em context", () => {
      expect(resolvePipelineStage(base())).toBe("context")
    })
  })
})
