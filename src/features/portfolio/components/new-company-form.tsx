"use client"

// Extraído verbatim de app/dashboard/companies/page.tsx (FE-4, PR 4c — move puro).
import { useState } from "react"
import { useAuth } from "@/lib/auth-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Building2, Plus, X } from "lucide-react"
import { createCompany, errorDetailsFromUnknown, queryKeys } from "@/lib/api"
import { RequestIdSupportRow } from "@/components/ui/request-id-support"
import { useTribiaPlgTier } from "@/features/plg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CompanyCreatePayload, ServiceInput } from "@/types/api"

function makeId() {
  return Math.random().toString(36).slice(2)
}

interface DraftService {
  id: string
  description: string
  amount: string
  iss_rate: string
}

function toServiceInput(s: DraftService): ServiceInput {
  return { description: s.description, amount: s.amount, iss_rate: s.iss_rate }
}

export function NewCompanyForm({ onClose }: { onClose: () => void }) {
  const { userId, getToken } = useAuth()
  const plgTier = useTribiaPlgTier()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [taxContext, setTaxContext] = useState("")
  const [services, setServices] = useState<DraftService[]>([
    { id: makeId(), description: "", amount: "", iss_rate: "0.05" },
  ])

  const mutation = useMutation({
    mutationFn: async (payload: CompanyCreatePayload) => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return createCompany(token, userId, payload, plgTier)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.plgQuota.all })
      onClose()
    },
  })

  function addService() {
    setServices((prev) => [
      ...prev,
      { id: makeId(), description: "", amount: "", iss_rate: "0.05" },
    ])
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  function updateService(id: string, field: keyof DraftService, value: string) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const createErr = mutation.isError
    ? errorDetailsFromUnknown(mutation.error)
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({
      name: name.trim(),
      tax_context: taxContext.trim(),
      default_services: services
        .filter((s) => s.description.trim() && s.amount.trim())
        .map(toServiceInput),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="size-4 text-accent" />
          Nova empresa
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Nome da empresa *
        </Label>
        <Input
          placeholder="ex: Tribunal de Justiça do RS"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9"
        />
      </div>

      {/* Contexto tributário */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Contexto tributário
          <span className="ml-1 text-accent normal-case font-normal">(usado pela IA)</span>
        </Label>
        <Input
          placeholder="ex: Órgão público municipal, regime especial ISS..."
          value={taxContext}
          onChange={(e) => setTaxContext(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Serviços recorrentes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Serviços recorrentes
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addService} className="h-6 gap-1 text-xs">
            <Plus className="size-3" />
            Adicionar
          </Button>
        </div>

        {services.length > 0 && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_100px_80px_28px] gap-2 px-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor (R$)</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alíq. ISS</span>
              <span />
            </div>
            {services.map((svc) => (
              <div key={svc.id} className="grid grid-cols-[1fr_100px_80px_28px] gap-2 items-center">
                <Input
                  placeholder="Consultoria de TI"
                  value={svc.description}
                  onChange={(e) => updateService(svc.id, "description", e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="10000.00"
                  value={svc.amount}
                  onChange={(e) => updateService(svc.id, "amount", e.target.value)}
                  className="h-8 text-xs tabular-nums"
                />
                <Input
                  placeholder="0.05"
                  value={svc.iss_rate}
                  onChange={(e) => updateService(svc.id, "iss_rate", e.target.value)}
                  className="h-8 text-xs tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => removeService(svc.id)}
                  disabled={services.length === 1}
                  className="flex items-center justify-center size-7 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-20 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {createErr && (
        <div className="text-xs text-destructive space-y-1">
          <p>{createErr.message || "Erro ao criar empresa."}</p>
          {createErr.requestId ? (
            <RequestIdSupportRow
              requestId={createErr.requestId}
              className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-2 py-1.5 text-[0.7rem] text-muted-foreground"
            />
          ) : null}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={mutation.isPending || !name.trim()}>
          {mutation.isPending ? "Salvando…" : "Salvar empresa"}
        </Button>
      </div>
    </form>
  )
}
