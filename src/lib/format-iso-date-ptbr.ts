/**
 * Formata uma data ISO "YYYY-MM-DD" (sem hora — meia-noite UTC), formato real
 * de campos como `published_at`/`run_at` no backend Go, para pt-BR (dd/mm/aaaa).
 *
 * timeZone: "UTC" é obrigatório: sem isso, `toLocaleDateString` converte a
 * meia-noite UTC para o fuso local do navegador antes de formatar — em
 * qualquer fuso negativo (Brasil, UTC-3) o dia exibido regride um dia
 * (22/07 vira 21/07).
 *
 * Extraído de `base-legal-selo.tsx` (formatDataBase) e `motor-validado-selo.tsx`
 * (formatRunAt) — mesma correção, duplicada duas vezes; agora reusada também
 * por `selo-autoridade.tsx` (item A4).
 */
export function formatIsoDatePtBR(iso: string | undefined | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return iso
  }
}
