import { cn } from "@/lib/utils"

/** Malha única navbar + páginas autenticadas (Plano 01 — TribIA shell). */
export const SHELL_INNER_CLASS =
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" as const

export function shellPageClass(...extra: (string | false | undefined)[]) {
  return cn(SHELL_INNER_CLASS, "py-8 space-y-6", ...extra)
}
