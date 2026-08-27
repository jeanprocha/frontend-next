import Link from "next/link"
import { Building2 } from "lucide-react"
import { ROTAS } from "@/constants/routes"

export default function ClienteNaoEncontrado() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
      <Building2 className="size-10 opacity-60" aria-hidden />
      <p className="text-sm font-medium text-foreground/85">Cliente não encontrado.</p>
      <p className="max-w-xs text-xs">
        Este cliente não existe na sua carteira ou foi removido.
      </p>
      <Link
        href={ROTAS.clientes}
        className="mt-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
      >
        Voltar para Clientes
      </Link>
    </div>
  )
}
