"use client"

import type { ComponentProps } from "react"
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
  user: { id: string; publicMetadata: unknown } | null | undefined
}

const fakeAuth: AppAuthState = {
  isLoaded: true,
  isSignedIn: true,
  userId: E2E_FAKE_USER_ID,
  // Não-nulo: liga o caminho de persistência (X-User-ID / Authorization) do pipeline.
  getToken: async () => "e2e-fake-token",
}

const fakeUser: AppUserState = {
  isLoaded: true,
  isSignedIn: true,
  // publicMetadata vazia: o tier PLG vem do fallback NEXT_PUBLIC_TRIBIA_PLG_TIER.
  user: { id: E2E_FAKE_USER_ID, publicMetadata: {} },
}

function useClerkAuthAdapter(): AppAuthState {
  return useClerkAuth()
}
function useFakeAuth(): AppAuthState {
  return fakeAuth
}
function useClerkUserAdapter(): AppUserState {
  return useClerkUser()
}
function useFakeUser(): AppUserState {
  return fakeUser
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
