"use client"

// Extraído verbatim de app/dashboard/companies/page.tsx (FE-4, PR 4c — move puro).
import { useAuth } from "@/lib/auth-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Receipt, Trash2 } from "lucide-react"
import { deleteCompany, queryKeys } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CompanyTemplate } from "@/types/api"

export function CompanyCard({
  company,
  onUse,
}: {
  company: CompanyTemplate
  onUse: (c: CompanyTemplate) => void
}) {
  const { userId, getToken } = useAuth()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return deleteCompany(token, userId, company.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.companies.all }),
  })

  function handleDelete() {
    if (!window.confirm(`Excluir "${company.name}"? Esta ação não pode ser desfeita.`)) return
    deleteMutation.mutate()
  }

  const services = company.default_services ?? []

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{company.name}</h3>
          {company.tax_context && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {company.tax_context}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="shrink-0 flex items-center justify-center size-7 rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors"
          title="Excluir empresa"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {services.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Receipt className="size-3" />
            Serviços recorrentes
          </p>
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 4).map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs h-4 px-1.5 font-normal">
                {s.description || "Serviço"}
              </Badge>
            ))}
            {services.length > 4 && (
              <Badge variant="outline" className="text-xs h-4 px-1.5 font-normal">
                +{services.length - 4}
              </Badge>
            )}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs gap-1.5"
        onClick={() => onUse(company)}
      >
        <Receipt className="size-3" />
        Abrir workspace
      </Button>
    </div>
  )
}
