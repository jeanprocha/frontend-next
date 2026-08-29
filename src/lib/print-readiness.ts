/**
 * D3/Frente D — contrato DOM partilhado entre features/report (marca
 * conteúdo lazy que ainda está a carregar) e features/simulation (espera
 * esse conteúdo terminar antes de `window.print()`, ver
 * features/simulation/hooks/use-print-full-document.ts). Vive em `lib/`
 * porque as duas features precisam do MESMO nome de atributo sem se
 * importarem uma à outra (regra de fronteira: feature não importa de
 * feature) — é um atributo de dados combinado, lido/escrito via DOM, não um
 * import cruzado.
 *
 * Por que existe: os gráficos da aba Cronograma usam `next/dynamic`
 * (ssr:false) — se o usuário nunca abriu essa aba, o chunk ainda não
 * carregou quando o botão "Exportar PDF" força a composição completa do
 * documento (mode="board" no ReportRenderer). Sem este marcador, o PDF
 * sairia com o esqueleto de carregamento em vez do gráfico.
 */
export const PRINT_PENDING_ATTR = "data-tribia-print-pending"
export const PRINT_PENDING_SELECTOR = `[${PRINT_PENDING_ATTR}]`
