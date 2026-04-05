"use client"

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

// Quando o browser restaura a página via bfcache (botão "voltar" após redirect
// para um domínio externo, como o hosted sign-in do Clerk), o SDK do Clerk pode
// ficar num estado onde modais/handlers ficam presos. Um reload resolve.
function BfcacheGuard() {
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        window.location.reload()
      }
    }
    window.addEventListener("pageshow", handlePageShow)
    return () => window.removeEventListener("pageshow", handlePageShow)
  }, [])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  // useState garante que cada sessão do navegador use sua própria instância
  // do QueryClient, evitando vazamento de estado entre requests no SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            // 1 retry automático em falhas de rede antes de reportar erro
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <BfcacheGuard />
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
