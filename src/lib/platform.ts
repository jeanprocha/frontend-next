/** Heurística cliente para rótulos de atalho (⌘ vs Ctrl). */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform) || /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
}

export function modKeyLabel(): string {
  return isApplePlatform() ? "⌘" : "Ctrl"
}
