/**
 * Fonte única de rótulos de atalho na UI (Power user / checklist §6).
 * O listener global (`keydown`) permanece em `command-menu.tsx`; ao mudar uma
 * tecla, actualizar **este ficheiro** e o `onKey` em coordenação.
 *
 * ## Matriz de conformidade (listener vs UI)
 *
 * | Acção        | Tecla        | Condição (resumo)                         | Listener           | UI |
 * |--------------|-------------|-------------------------------------------|--------------------|-----|
 * | Simular      | Mod+Enter   | `runSimulation` definido; alvo não editável | `command-menu.tsx` | `result-sidebar.tsx`, palette |
 * | Novo serviço | A           | Dashboard fase input; não editável        | `command-menu.tsx` | `simulation-form`, empty state, palette |
 * | Nova despesa | D           | Idem                                      | `command-menu.tsx` | Idem |
 * | Simulador    | Mod+K       | Pesquisar / seleccionar na palette (sem tecla dedicada) | — | `command-menu.tsx`, `tribia-top-nav.tsx` |
 * | Histórico    | G → H       | Não editável; sem dialog aberto           | `command-menu.tsx` | Rodapé palette |
 * | Apresentação | B           | `toggleBoardReady` definido               | `command-menu.tsx` | Palette |
 * | Comandos     | Mod+K       | Toggle: se palette aberta, sempre; se fechada, alvo não editável e sem outro dialog | `command-menu.tsx` | Rodapé palette |
 *
 * **Contenteditable de terceiros:** preferir `data-command-palette-ignore-hotkeys` no
 * contentor ou rever `isEditableTarget` em `command-menu.tsx` (`closest('[contenteditable="true"]')`).
 */

import { modKeyLabel as modKeyLabelFn } from "@/lib/platform"

export { modKeyLabel } from "@/lib/platform"

/** Janela em ms após **G** para aceitar **H** (histórico). */
export const LEADER_G_MS = 900

/** Rótulos da navegação principal (navbar + palette) — fonte única. */
export const NAV_LINK_LABELS = {
  simulator: "Simulador",
  companies: "Empresas",
  history: "Histórico",
} as const

/** Texto do `CommandItem` na palette (ir para `/dashboard`). */
export const PALETTE_GO_SIMULATOR_LABEL = "Ir para o Simulador"

/** Teclas mostradas na UI (devem coincidir com `onKey` em `command-menu.tsx`). */
export const SHORTCUT_KEYS = {
  paletteOpen: "K",
  addService: "A",
  addExpense: "D",
  board: "B",
  leaderHistory: "G",
  followHistory: "H",
  simulateSubmit: "Enter",
} as const

/** Rótulo único para `CommandShortcut` / hints (ex.: `⌘+Enter`). */
export function simulateShortcutLabel(): string {
  return `${modKeyLabelFn()}+Enter`
}

/** Legenda da sequência de histórico (rodapé, docs, leitores de ecrã). */
export function historySequenceHint(): string {
  return `${SHORTCUT_KEYS.leaderHistory} e depois ${SHORTCUT_KEYS.followHistory} — histórico`
}

/**
 * Fragmento do rodapé da palette: atalhos globais fora da palette aberta.
 * Ordem: simulação → linhas → histórico → (opcional) apresentação.
 */
export function commandPaletteGlobalHints(canBoard: boolean): string {
  const mod = modKeyLabelFn()
  const parts = [
    `${mod}+Enter simular`,
    `${SHORTCUT_KEYS.addService}/${SHORTCUT_KEYS.addExpense} linhas`,
    historySequenceHint(),
  ]
  if (canBoard) {
    parts.push(`${SHORTCUT_KEYS.board} apresentação`)
  }
  return `· ${parts.join(" · ")}`
}
