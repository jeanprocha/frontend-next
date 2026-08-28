"use client"

import { useEffect, useMemo, useSyncExternalStore, type ComponentProps } from "react"
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  SignInButton as ClerkSignInButton,
  UserButton as ClerkUserButton,
} from "@clerk/nextjs"
import { E2E_AUTH_BYPASS, E2E_FAKE_USER_ID } from "@/lib/e2e-auth-bypass"

/**
 * Seam de auth (FE-0): interface estreita com só o que o app consome de
 * useAuth/useUser do Clerk (verificado call site a call site). Sob o bypass
 * E2E, troca por um estado fake offline — ver e2e-auth-bypass.ts para o
 * porquê disso ser inatingível em produção.
 */
export interface AppAuthState {
  isLoaded: boolean
  isSignedIn: boolean | undefined
  userId: string | null | undefined
  getToken: () => Promise<string | null>
}

export interface AppUserState {
  isLoaded: boolean
  isSignedIn: boolean | undefined
  user:
    | {
        id: string
        publicMetadata: unknown
        /**
         * Etapa N/PR 9 — marca do escritório (branding_logo_url/branding_org_name)
         * vive aqui, não em publicMetadata: o SDK do Clerk só escreve
         * unsafeMetadata a partir do cliente (publicMetadata exigiria um
         * endpoint de backend com Clerk Backend SDK + CLERK_SECRET_KEY, que
         * não existe hoje). tribia_plan continua em publicMetadata —
         * controlado por quem administra a conta, não pelo próprio usuário.
         */
        unsafeMetadata: unknown
        update: (params: { unsafeMetadata: Record<string, unknown> }) => Promise<unknown>
      }
    | null
    | undefined
}

const fakeAuth: AppAuthState = {
  isLoaded: true,
  isSignedIn: true,
  userId: E2E_FAKE_USER_ID,
  // Não-nulo: liga o caminho de persistência (X-User-ID / Authorization) do pipeline.
  getToken: async () => "e2e-fake-token",
}

function readE2eTierCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)e2e_tier=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function useClerkAuthAdapter(): AppAuthState {
  return useClerkAuth()
}
function useFakeAuth(): AppAuthState {
  return fakeAuth
}
function useClerkUserAdapter(): AppUserState {
  const { user, isLoaded, isSignedIn } = useClerkUser()
  // Referência estável entre renders sem mudança real de dado — TribiaPlanProvider
  // memoiza sobre `user`, e ele alimenta contexto consumido pelo app inteiro
  // (badge de plano, PlgLimitMeter, toda checagem de capability).
  return useMemo(
    () => ({
      isLoaded,
      isSignedIn,
      user: user
        ? {
            id: user.id,
            publicMetadata: user.publicMetadata,
            unsafeMetadata: user.unsafeMetadata,
            update: (params: { unsafeMetadata: Record<string, unknown> }) => user.update(params),
          }
        : user,
    }),
    [isLoaded, isSignedIn, user],
  )
}
/**
 * Etapa N/PR 9 — store módulo-escopo, não `useState` por componente: Clerk
 * real compartilha UM único user resource entre todo mundo que chama
 * useUser() (SettingsPage grava, TribiaPlanProvider em outro ponto da árvore
 * lê); `useState` local faria cada call site ter sua própria cópia isolada
 * — uma gravação em /configuracoes nunca apareceria em lugar nenhum fora do
 * próprio componente. `useSyncExternalStore` é o primitivo certo pra um
 * estado mutável externo compartilhado entre componentes.
 */
let fakeUserMetadata: { publicMetadata: Record<string, unknown>; unsafeMetadata: Record<string, unknown> } = {
  publicMetadata: {},
  unsafeMetadata: {},
}
const fakeUserListeners = new Set<() => void>()

function subscribeFakeUser(listener: () => void): () => void {
  fakeUserListeners.add(listener)
  return () => fakeUserListeners.delete(listener)
}
function getFakeUserSnapshot() {
  return fakeUserMetadata
}
function setFakeUserMetadata(next: typeof fakeUserMetadata): void {
  fakeUserMetadata = next
  for (const listener of fakeUserListeners) listener()
}

/**
 * Porta de tier E2E (FE-4/PR 4f): duas passadas, como o resto do bypass.
 * A primeira renderização devolve metadata vazia (SSR-safe, document.cookie
 * não existe no servidor); o `useEffect` só roda no cliente e aplica
 * `publicMetadata.tribia_plan` a partir do cookie `e2e_tier` (definido por
 * e2e/fixtures/tier.ts antes do primeiro goto), se presente. Mesmo fail-safe
 * do resto do módulo: morto em produção junto com E2E_AUTH_BYPASS (ver
 * e2e-auth-bypass.ts).
 */
function useFakeUser(): AppUserState {
  const metadata = useSyncExternalStore(subscribeFakeUser, getFakeUserSnapshot, getFakeUserSnapshot)

  useEffect(() => {
    const tier = readE2eTierCookie()
    if (!tier || fakeUserMetadata.publicMetadata.tribia_plan === tier) return
    setFakeUserMetadata({
      ...fakeUserMetadata,
      publicMetadata: { ...fakeUserMetadata.publicMetadata, tribia_plan: tier },
    })
  }, [])

  return useMemo(
    () => ({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: E2E_FAKE_USER_ID,
        publicMetadata: metadata.publicMetadata,
        unsafeMetadata: metadata.unsafeMetadata,
        update: async (params: { unsafeMetadata: Record<string, unknown> }) => {
          setFakeUserMetadata({
            ...fakeUserMetadata,
            unsafeMetadata: { ...fakeUserMetadata.unsafeMetadata, ...params.unsafeMetadata },
          })
        },
      },
    }),
    [metadata],
  )
}

// Seleção em ESCOPO DE MÓDULO: cada componente chama sempre o mesmo hook
// durante toda a vida da app — sem branch em render, sem violar rules-of-hooks.
export const useAuth = E2E_AUTH_BYPASS ? useFakeAuth : useClerkAuthAdapter
export const useUser = E2E_AUTH_BYPASS ? useFakeUser : useClerkUserAdapter

function FakeSignInButton({ children }: ComponentProps<typeof ClerkSignInButton>) {
  return <>{children}</>
}

function FakeUserButton(_props: ComponentProps<typeof ClerkUserButton>) {
  return (
    <span
      aria-label="Sessão de teste E2E"
      className="inline-flex size-8 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground"
    >
      E2E
    </span>
  )
}

export const SignInButton = E2E_AUTH_BYPASS ? FakeSignInButton : ClerkSignInButton
export const UserButton = E2E_AUTH_BYPASS ? FakeUserButton : ClerkUserButton
