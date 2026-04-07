/**
 * Formatação CFO-first: valores monetários sem parseFloat na magnitude principal.
 */

/** Agrupa dígitos (milhares com ponto) sem perder precisão em BigInt. */
function formatIntegerPtBR(n: bigint): string {
  let s = n.toString()
  if (s.length <= 3) return s
  const parts: string[] = []
  while (s.length > 3) {
    parts.unshift(s.slice(-3))
    s = s.slice(0, -3)
  }
  parts.unshift(s)
  return parts.join(".")
}

/** Remove ruído, mantém opcionalmente um sinal '-' e um separador decimal '.'. */
export function sanitizeDecimalString(raw: string): string {
  const t = raw.trim()
  if (!t) return ""
  const neg = t.startsWith("-")
  const body = (neg ? t.slice(1) : t).replace(/[^\d.]/g, "")
  if (!body || body === ".") return ""
  const firstDot = body.indexOf(".")
  let normalized = body
  if (firstDot !== -1) {
    const head = body.slice(0, firstDot + 1)
    const tail = body.slice(firstDot + 1).replace(/\./g, "")
    normalized = head + tail
  }
  return neg ? `-${normalized}` : normalized
}

/**
 * Converte string decimal fixa para centavos (BigInt), com arredondamento HALF-UP na 2ª casa.
 */
export function decimalStringToCents(value: string): bigint | null {
  const s = sanitizeDecimalString(value)
  if (!s || s === "-" || s === "-.") return null
  const neg = s.startsWith("-")
  const body = neg ? s.slice(1) : s
  const [intRaw, fracRaw = ""] = body.split(".")
  if (intRaw.includes(".") || fracRaw.includes(".")) return null
  const intDigits = intRaw.replace(/\D/g, "") || "0"
  const frac = (fracRaw.replace(/\D/g, "") + "000").slice(0, 3)
  const d0 = frac.charCodeAt(0) >= 48 ? frac.charCodeAt(0) - 48 : 0
  const d1 = frac.charCodeAt(1) >= 48 ? frac.charCodeAt(1) - 48 : 0
  const d2 = frac.charCodeAt(2) >= 48 ? frac.charCodeAt(2) - 48 : 0
  let sub = d0 * 10 + d1
  if (d2 >= 5) sub += 1
  let intPart = BigInt(intDigits)
  if (sub >= 100) {
    intPart += 1n
    sub -= 100
  }
  const cents = intPart * 100n + BigInt(sub)
  return neg ? -cents : cents
}

export function formatBRL(value: string): string {
  const cents = decimalStringToCents(value)
  if (cents === null) return "R$ —"
  const neg = cents < 0n
  const abs = neg ? -cents : cents
  const whole = abs / 100n
  const frac = abs % 100n
  const fracStr = frac.toString().padStart(2, "0")
  const sign = neg ? "-" : ""
  return `R$ ${sign}${formatIntegerPtBR(whole)},${fracStr}`
}

/** Percentual já em forma percentual (ex.: "-10.5" → "-10.5%"); uma casa decimal, HALF-UP. */
export function formatPct(value: string): string {
  const s = sanitizeDecimalString(value)
  if (!s || s === "-") return "—"
  const neg = s.startsWith("-")
  const body = neg ? s.slice(1) : s
  const [intRaw, fracRaw = ""] = body.split(".")
  const intDigits = intRaw.replace(/\D/g, "") || "0"
  const fracDigits = fracRaw.replace(/\D/g, "").slice(0, 8)
  const combined = intDigits + fracDigits
  if (!/^\d+$/.test(combined)) return "—"
  const num = BigInt(combined)
  const k = fracDigits.length
  const den = k === 0 ? 1n : 10n ** BigInt(k)
  let tenths = (num * 10n + den / 2n) / den
  if (neg) tenths = -tenths
  const t = tenths < 0n ? -tenths : tenths
  const sign = tenths < 0n ? "-" : ""
  const whole = t / 10n
  const d = t % 10n
  return `${sign}${whole.toString()}.${d.toString()}%`
}

/** Converte fração decimal (0–1) em décimos de ponto percentual (50 = 5,0%). */
function fractionToTenthsPercent(raw: string): bigint | null {
  const s = sanitizeDecimalString(raw)
  if (!s) return null
  if (s.startsWith("-")) return null
  const dot = s.indexOf(".")
  const intPart = dot === -1 ? s : s.slice(0, dot)
  const fracPart = dot === -1 ? "" : s.slice(dot + 1)
  const intDigits = intPart.replace(/\D/g, "") || "0"
  const fracDigits = fracPart.replace(/\D/g, "").slice(0, 12)
  const combined = intDigits + fracDigits
  if (!/^\d+$/.test(combined)) return null
  const num = BigInt(combined)
  const k = fracDigits.length
  const den = k === 0 ? 1n : 10n ** BigInt(k)
  return (num * 1000n + den / 2n) / den
}

/** Fração 0–1 (ex.: "0.05" ou número) → "5.0%". */
export function formatPctFraction(value: string | number): string {
  const raw =
    typeof value === "number"
      ? Number.isFinite(value)
        ? value.toFixed(12)
        : ""
      : value
  const tenths = fractionToTenthsPercent(String(raw).trim())
  if (tenths === null) return "—"
  const neg = tenths < 0n
  const t = neg ? -tenths : tenths
  const whole = t / 10n
  const d = t % 10n
  return `${neg ? "-" : ""}${whole.toString()}.${d.toString()}%`
}
