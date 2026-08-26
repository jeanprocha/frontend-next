"use client"

import { useEffect, useRef, useState } from "react"
import Papa from "papaparse"
import { useAuth } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { classifyBatch } from "@/lib/api"
import { useTribiaPlgTier } from "@/features/plg"
import type { ClassificationItem, FormExpense } from "@/types/api"

export interface UploadResult {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
}

export type UploadZonePipelinePhase = "idle" | "parsing" | "classifying" | "done"

interface UploadZoneProps {
  companyContext?: string
  onResult: (result: UploadResult) => void
  onError: (msg: string) => void
  /** Para alinhar glow / data-pipeline-stage ao processamento do CSV. */
  onPhaseChange?: (phase: UploadZonePipelinePhase) => void
}

type Phase =
  | { type: "idle" }
  | { type: "parsing" }
  | { type: "classifying"; total: number }
  | { type: "done" }

// Colunas aceitas no CSV (case-insensitive, variações PT e EN)
const COL_DESC = ["descricao", "descrição", "description", "desc", "nome", "name", "item"]
const COL_AMT = ["valor", "value", "amount", "preco", "preço", "price", "custo", "cost"]

function findCol(headers: string[], candidates: string[]): string | undefined {
  return headers.find((h) => candidates.includes(h.trim().toLowerCase()))
}

export function UploadZone({
  companyContext = "",
  onResult,
  onError,
  onPhaseChange,
}: UploadZoneProps) {
  const { userId, getToken } = useAuth()
  const plgTier = useTribiaPlgTier()
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>({ type: "idle" })
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    if (!onPhaseChange) return
    const p: UploadZonePipelinePhase =
      phase.type === "idle"
        ? "idle"
        : phase.type === "parsing"
          ? "parsing"
          : phase.type === "classifying"
            ? "classifying"
            : "done"
    onPhaseChange(p)
  }, [phase, onPhaseChange])

  async function handleFile(file: File) {
    setFileName(file.name)
    setPhase({ type: "parsing" })

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const headers = res.meta.fields ?? []
        const descCol = findCol(headers, COL_DESC)
        const amtCol = findCol(headers, COL_AMT)

        if (!descCol) {
          onError(
            `Coluna de descrição não encontrada. Esperado: ${COL_DESC.join(", ")}. Colunas detectadas: ${headers.join(", ")}`,
          )
          setPhase({ type: "idle" })
          return
        }

        const rows = res.data
          .map((row, i) => ({
            id: String(i),
            description: (row[descCol] ?? "").trim(),
            amount: amtCol ? (row[amtCol] ?? "0").trim() : "0",
          }))
          .filter((r) => r.description)

        if (rows.length === 0) {
          onError("Nenhuma linha válida encontrada no arquivo.")
          setPhase({ type: "idle" })
          return
        }

        setPhase({ type: "classifying", total: rows.length })

        try {
          const token = await getToken()
          const plgAuth =
            token && userId
              ? { token, userId, plan: plgTier }
              : null
          const batch = await classifyBatch(
            rows.map((r) => ({ description: r.description, context: companyContext })),
            5,
            plgAuth,
          )

          onResult({ expenses: rows, classifications: batch.results })
          setPhase({ type: "done" })
        } catch (err) {
          onError(err instanceof Error ? err.message : "Erro ao classificar despesas")
          setPhase({ type: "idle" })
        }
      },
      error: (err) => {
        onError(`Erro ao ler CSV: ${err.message}`)
        setPhase({ type: "idle" })
      },
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // resetar o input para permitir re-upload do mesmo arquivo
    e.target.value = ""
  }

  const isLoading = phase.type === "parsing" || phase.type === "classifying"

  return (
    <Card className="border-dashed border-2 bg-muted/20 p-8">
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Ícone animado */}
        <div className="rounded-full bg-primary/10 p-4">
          {isLoading ? (
            <svg
              className="h-8 w-8 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
        </div>

        {/* Texto de status */}
        <div>
          <p className="font-medium">
            {phase.type === "idle" && "Upload de Despesas (CSV)"}
            {phase.type === "parsing" && "Lendo arquivo…"}
            {phase.type === "classifying" &&
              `Classificando ${phase.total} despesas com IA + RAG…`}
            {phase.type === "done" && "Classificação concluída!"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {phase.type === "idle"
              ? "Colunas aceitas: descricao/description + valor/amount"
              : fileName ?? ""}
          </p>
        </div>

        {/* Barra de progresso animada durante classificação */}
        {phase.type === "classifying" && (
          <div className="w-full max-w-xs rounded-full bg-muted h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-full" />
          </div>
        )}

        {/* Botão de ação */}
        {!isLoading && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleChange}
            />
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              {phase.type === "done" ? "Novo arquivo" : "Selecionar arquivo CSV"}
            </Button>
          </>
        )}

        {/* Dica de formato */}
        {phase.type === "idle" && (
          <p className="text-xs text-muted-foreground">
            Exemplo de cabeçalho:{" "}
            <code className="font-mono bg-muted px-1 rounded">descricao,valor</code>
          </p>
        )}
      </div>
    </Card>
  )
}
