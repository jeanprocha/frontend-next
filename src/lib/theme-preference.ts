const STORAGE_KEY = "tribia-theme"

/** Aplica preferência guardada (chamado uma vez no cliente). */
export function initThemeFromStorage(): void {
  if (typeof window === "undefined") return
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    const root = document.documentElement
    if (v === "dark") root.classList.add("dark")
    else if (v === "light") root.classList.remove("dark")
  } catch {
    /* ignore */
  }
}

/** Alterna classe `dark` em `<html>` e persiste em localStorage. */
export function toggleColorTheme(): void {
  if (typeof window === "undefined") return
  const root = document.documentElement
  const nextDark = !root.classList.contains("dark")
  root.classList.toggle("dark", nextDark)
  try {
    localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light")
  } catch {
    /* ignore */
  }
}
