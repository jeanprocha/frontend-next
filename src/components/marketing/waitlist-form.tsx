"use client"

// Etapa M/PR 9 — substitui o CTA morto ("Entrar na lista de espera", um
// <span> não clicável antes da reescrita da landing na PR 10) por captura
// real: POST /waitlist (rate-limited, tabela dedicada — docs/migrations/010).
import { useId, useState } from "react"
import { Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorDetailsFromUnknown, joinWaitlist } from "@/lib/api"

type Status = "idle" | "submitting" | "done" | "error"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputId = useId()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === "submitting") return
    setStatus("submitting")
    setErrorMessage(null)
    try {
      await joinWaitlist(email)
      setStatus("done")
    } catch (err) {
      setStatus("error")
      setErrorMessage(errorDetailsFromUnknown(err).message)
    }
  }

  if (status === "done") {
    return (
      <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
        Você está na lista. Avisamos assim que houver vaga.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor={inputId} className="sr-only">
          E-mail para entrar na lista de espera
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={inputId}
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
            className="pl-8"
            aria-invalid={status === "error"}
          />
        </div>
        {status === "error" && errorMessage ? (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={status === "submitting"} className="shrink-0 gap-1.5">
        {status === "submitting" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        Entrar na lista de espera
      </Button>
    </form>
  )
}
