"use client"

// Zona de upload genérica (FE-3, PR 3c) — herdeira visual do antigo
// upload-zone.tsx, mas sem classifyBatch/auth/fase "classifying": só lê o
// arquivo, chama importer.parse() e aplica o rascunho ao store. Erros de
// parse aparecem aqui mesmo, não mais no banner de erro do dashboard.
import { useRef, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { applyDraftToStore } from "../lib/apply-draft"
import type { ImportAppliedSummary, ImporterDefinition } from "@/lib/importer-contract"

interface FileDropZoneProps {
  importer: ImporterDefinition
  onApplied: (summary: ImportAppliedSummary) => void
}

type Phase =
  | { type: "idle" }
  | { type: "parsing" }
  | { type: "done"; fileName: string }
  | { type: "error"; message: string }

export function FileDropZone({ importer, onApplied }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>({ type: "idle" })

  async function handleFile(file: File) {
    setPhase({ type: "parsing" })
    try {
      const content = await file.text()
      const result = await importer.parse(content, { fileName: file.name })
      if (!result.ok) {
        setPhase({ type: "error", message: result.error })
        return
      }
      applyDraftToStore(result.draft)
      setPhase({ type: "done", fileName: file.name })
      onApplied({
        importerId: importer.id,
        fileName: file.name,
        servicesCount: result.draft.services?.length ?? 0,
        expensesCount: result.draft.expenses?.length ?? 0,
      })
    } catch (err) {
      setPhase({ type: "error", message: err instanceof Error ? err.message : "Erro ao ler o arquivo." })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    // Reseta o input para permitir re-upload do mesmo arquivo.
    e.target.value = ""
  }

  const isLoading = phase.type === "parsing"
  const isError = phase.type === "error"

  return (
    <Card
      className={cn(
        "border-dashed border-2 p-8",
        isError ? "border-destructive/40 bg-destructive/5" : "bg-muted/20",
      )}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className={cn("rounded-full p-4", isError ? "bg-destructive/10" : "bg-primary/10")}>
          {isLoading ? (
            <svg
              className="h-8 w-8 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className={cn("h-8 w-8", isError ? "text-destructive" : "text-primary")}
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

        <div>
          <p className="font-medium">
            {phase.type === "idle" && importer.label}
            {phase.type === "parsing" && "Lendo arquivo…"}
            {phase.type === "done" && "Arquivo importado!"}
            {phase.type === "error" && "Não foi possível importar"}
          </p>
          <p className={cn("text-sm mt-1", isError ? "text-destructive" : "text-muted-foreground")} role={isError ? "alert" : undefined}>
            {phase.type === "idle" && importer.formatHint ? `Colunas aceitas: ${importer.formatHint} (aceita variações PT/EN)` : null}
            {phase.type === "done" && phase.fileName}
            {phase.type === "error" && phase.message}
          </p>
        </div>

        {!isLoading && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={importer.accepts.join(",")}
              className="hidden"
              onChange={handleChange}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              {phase.type === "done" || phase.type === "error" ? "Novo arquivo" : "Selecionar arquivo"}
            </Button>
          </>
        )}

        {phase.type === "idle" && importer.formatHint && (
          <p className="text-xs text-muted-foreground">
            Exemplo de cabeçalho: <code className="font-mono bg-muted px-1 rounded">{importer.formatHint}</code>
          </p>
        )}

        {/* CSV de exemplo real, no formato aceito por este importer — Etapa M/PR 4 */}
        {phase.type === "idle" && importer.id === "csv" && (
          <a
            href="/despesas.csv"
            download
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <Download className="size-3" aria-hidden />
            Baixar CSV de exemplo
          </a>
        )}
      </div>
    </Card>
  )
}
