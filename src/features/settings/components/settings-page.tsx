"use client"

// Etapa N/PR 9 (fato 12) — a landing promete "Marca do escritório no dossiê"
// (Premium); esta tela é o que torna essa linha verificável dentro do
// produto. Grava em unsafeMetadata (não publicMetadata — ver comentário em
// lib/auth-client.tsx sobre a decisão), que TribiaPlanProvider já lê via
// useTribiaBranding(); o próximo dossiê gerado (handleOpenDossier em
// simulation-dashboard.tsx) sai com a marca sem nenhuma outra mudança.
import { useState, type FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { Building2, Lock } from "lucide-react"
import { useUser } from "@/lib/auth-client"
import { errorDetailsFromUnknown } from "@/lib/api"
import { useCapability, useTribiaBranding, PlgUpgradeDialog } from "@/features/plg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShellBreadcrumb, type ShellBreadcrumbItem } from "@/components/shell/shell-breadcrumb"
import { shellPageClass } from "@/lib/shell-layout"

const cardShell =
  "max-w-xl rounded-2xl border border-border/60 bg-white/80 backdrop-blur-md p-6 dark:border-border/60 dark:bg-card/80"

/** Vazio é válido (limpa a marca) — só recusa texto que não é um link completo. */
function isValidLogoUrl(url: string): boolean {
  const t = url.trim()
  if (!t) return true
  return /^https?:\/\//i.test(t)
}

export interface SettingsPageProps {
  breadcrumbItems: ShellBreadcrumbItem[]
}

export function SettingsPage({ breadcrumbItems }: SettingsPageProps) {
  const { user } = useUser()
  const whiteLabelUnlocked = useCapability("whiteLabelExport")
  const { brandingLogoUrl, brandingOrgName } = useTribiaBranding()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const [logoUrl, setLogoUrl] = useState(brandingLogoUrl ?? "")
  const [orgName, setOrgName] = useState(brandingOrgName ?? "")
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const urlError = !isValidLogoUrl(logoUrl)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado")
      await user.update({
        unsafeMetadata: {
          branding_logo_url: logoUrl.trim(),
          branding_org_name: orgName.trim(),
        },
      })
    },
    onSuccess: () => setSavedAt(Date.now()),
  })

  const saveErr = mutation.isError ? errorDetailsFromUnknown(mutation.error) : null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (urlError) return
    setSavedAt(null)
    mutation.mutate()
  }

  return (
    <div className={shellPageClass()}>
      <ShellBreadcrumb items={breadcrumbItems} />

      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Personalize a marca que aparece nos dossiês gerados.
        </p>
      </div>

      {!whiteLabelUnlocked ? (
        <div className={cardShell}>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="size-5" aria-hidden />
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Marca do escritório — Premium</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No plano Premium, seu logotipo e o nome do escritório substituem a marca TribIA no
                cabeçalho dos dossiês PDF e impressos gerados a partir de agora.
              </p>
              <Button type="button" size="sm" onClick={() => setUpgradeOpen(true)}>
                Conhecer no Premium
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`${cardShell} space-y-5`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="size-4 text-accent" aria-hidden />
            Marca do escritório
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="branding-org-name"
              className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              Nome do escritório
            </Label>
            <Input
              id="branding-org-name"
              placeholder="ex.: Escritório Silva & Associados"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value)
                setSavedAt(null)
              }}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="branding-logo-url"
              className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              URL do logotipo
            </Label>
            <Input
              id="branding-logo-url"
              placeholder="https://…"
              value={logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value)
                setSavedAt(null)
              }}
              aria-invalid={urlError || undefined}
              className="h-9"
            />
            {urlError ? (
              <p role="alert" className="text-xs text-destructive">
                Cole um link completo (começando com http:// ou https://) ou deixe em branco.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Cole o link de uma imagem já publicada (ex.: https://…).
              </p>
            )}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Aparece no cabeçalho dos dossiês PDF e impressos gerados a partir de agora — dossiês já
            gerados não mudam retroativamente.
          </p>

          {saveErr && (
            <p role="alert" className="text-sm text-destructive">
              {saveErr.message || "Não foi possível salvar."}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={mutation.isPending || urlError}>
              {mutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
            {savedAt && !mutation.isPending && (
              <span className="text-xs text-muted-foreground">Alterações salvas.</span>
            )}
          </div>
        </form>
      )}

      <PlgUpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} feature="white_label" />
    </div>
  )
}
