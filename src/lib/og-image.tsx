/**
 * Card compartilhado por opengraph-image.tsx e twitter-image.tsx (Etapa
 * M/PR 5) — satori (o motor por trás de next/og) não entende tokens CSS
 * (oklch/var()), só cor estática, então os valores abaixo são a tradução
 * hexadecimal manual dos tokens de `globals.css` (Institucional Moderno):
 * navy #0F172A (--primary), esmeralda #059669 (--accent), fundo #F8FAFC.
 *
 * Genérico de propósito — "sem dado de cliente" (docs/roadmap-execucao.md
 * §4.2, PR 5): o mesmo card serve a landing e o dossiê público, porque o
 * conteúdo de um dossiê real nunca deve vazar num preview de link.
 */
export function TribiaOgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        backgroundColor: "#0F172A",
        color: "#F8FAFC",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* Losango desenhado em CSS, não o glifo Unicode "◈" — satori tenta
            baixar uma fonte dinâmica por glifo, e símbolos fora do Latin
            básico frequentemente falham (Status 400 no build real). */}
        <div
          style={{
            display: "flex",
            width: 30,
            height: 30,
            transform: "rotate(45deg)",
            border: "3px solid #34D399",
          }}
        />
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>TribIA</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#34D399",
          }}
        >
          Diagnóstico da reforma tributária
        </span>
        <span style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.12, maxWidth: 920 }}>
          Um parecer, não uma estimativa.
        </span>
        <span style={{ fontSize: 26, color: "#CBD5E1" }}>
          CBS · IBS · transição 2026–2033 · citação auditável da LC 214/2025
        </span>
      </div>
    </div>
  )
}
