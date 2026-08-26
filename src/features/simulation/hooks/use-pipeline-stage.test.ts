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
    loading: false,
    hasFormSimulationResults: false,
    hasCsvClassificationResults: false,
    csvProcessing: false,
    inputMode: "form",
    services: [],
    expenses: [],
    ...over,
  }
}

describe("resolvePipelineStage", () => {
  describe("prioridade 1 — verdict", () => {
    it("retorna verdict quando há resultados de simulação form e não está a carregar", () => {
      expect(
        resolvePipelineStage(
          base({
            hasFormSimulationResults: true,
            loading: false,
          }),
        ),
      ).toBe("verdict")
    })

    it("não retorna verdict enquanto loading com resultados já presentes (precedência simulação)", () => {
      expect(
        resolvePipelineStage(
          base({
            hasFormSimulationResults: true,
            loading: true,
          }),
        ),
      ).toBe("simulation")
    })
  })

  describe("prioridade 2 — simulation", () => {
    it("retorna simulation quando mutation loading no form", () => {
      expect(
        resolvePipelineStage(
          base({
            loading: true,
            services: [validSvc],
            expenses: [validExp],
          }),
        ),
      ).toBe("simulation")
    })

    it("retorna simulation quando csvProcessing", () => {
      expect(
        resolvePipelineStage(
          base({
            inputMode: "csv",
            csvProcessing: true,
            hasCsvClassificationResults: false,
          }),
        ),
      ).toBe("simulation")
    })

    it("csvProcessing prevalece sobre resultados CSV (ainda a processar)", () => {
      expect(
        resolvePipelineStage(
          base({
            inputMode: "csv",
            csvProcessing: true,
            hasCsvClassificationResults: true,
          }),
        ),
      ).toBe("simulation")
    })
  })

  describe("prioridade 3 — classification", () => {
    it("retorna classification com resultados CSV e sem loading", () => {
      expect(
        resolvePipelineStage(
          base({
            inputMode: "csv",
            hasCsvClassificationResults: true,
            loading: false,
            csvProcessing: false,
          }),
        ),
      ).toBe("classification")
    })

    it("retorna classification no form com ≥1 serviço e ≥1 despesa válidos, sem resultados", () => {
      expect(
        resolvePipelineStage(
          base({
            inputMode: "form",
            services: [validSvc],
            expenses: [validExp],
            loading: false,
          }),
        ),
      ).toBe("classification")
    })

    it("não entra em classification só com serviços válidos", () => {
      expect(
        resolvePipelineStage(
          base({
            services: [validSvc],
            expenses: [emptyExp],
          }),
        ),
      ).toBe("context")
    })

    it("não entra em classification só com despesas válidas", () => {
      expect(
        resolvePipelineStage(
          base({
            services: [emptySvc],
            expenses: [validExp],
          }),
        ),
      ).toBe("context")
    })
  })

  describe("default — context", () => {
    it("form vazio permanece em context", () => {
      expect(resolvePipelineStage(base())).toBe("context")
    })

    it("modo CSV idle sem resultados nem processamento", () => {
      expect(
        resolvePipelineStage(
          base({
            inputMode: "csv",
            hasCsvClassificationResults: false,
            csvProcessing: false,
            loading: false,
          }),
        ),
      ).toBe("context")
    })
  })
})
