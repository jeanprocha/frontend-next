# Sistema de tiers TribIA (Free, Pro, Premium)

Documento de referência: **diferenças visuais e funcionais** entre planos, alinhado ao código actual (`tribia-plg-flags`, `TribiaPlanProvider`, handlers PLG no Go). Não substitui o README de produto nem orientação fiscal.

---

## 1. Resumo executivo

| Tier     | Papel no produto (código) |
|----------|---------------------------|
| **Free** | Fluxo completo de simulação e classificação; **Raio-X** e **histórico** com *tease* visual; **quotas** e **marca d’água** quando activos; **sem** Board-Ready real, **sem** comparativo A/B operacional. |
| **Pro**  | Tudo o que Free permite, mais: Raio-X nítido, Board-Ready, comparar cenários (dashboard e histórico), histórico “rico”, **sem** limite diário de simulações no limitador Go (quando enforcement ligado), teto de empresas mais alto. |
| **Premium** | Tudo o que Pro permite, mais: **aba de parecer jurídico** no resumo executivo, **exportação white-label** (cabeçalho/rodapé impressos + metadados de marca), blocos **Compliance Radar** e **Inteligência colectiva** no painel da versão fiscal, **sem limite** de empresas no limitador Go. |

**Nota importante:** em `getPlgCapabilities`, **Pro e Premium partilham o mesmo conjunto “isPro”** para a maioria das flags. As exclusivas de Premium são `legalOpinionTab`, `whiteLabelExport`, `collectiveIntel`, `complianceRadar`.

---

## 2. Fonte de verdade do tier

### 2.1 Frontend (Next.js)

1. **`TribiaPlanProvider`** (`src/components/tribia/tribia-plan-provider.tsx`):
   - Valor inicial: `NEXT_PUBLIC_TRIBIA_PLG_TIER` (`free` | `pro` | `premium`; inválido → `free`).
   - Se o utilizador Clerk estiver carregado e `publicMetadata.tribia_plan` for uma string normalizada (`free` | `pro` | `premium`), **essa metadata ganha** e substitui o env.
   - Opcional: `branding_logo_url`, `branding_org_name` em public metadata (usados com white-label Premium).

2. **Hooks:** `useTribiaPlgTier()`, `usePlgCapabilities()`, `useRayxFullAccess()`, `useTribiaBranding()` (`src/hooks/use-tribia-plg-tier.ts`).

### 2.2 Backend (Go)

1. **JWT (Clerk):** claims `tribia_plan` ou `public_metadata.tribia_plan` (`internal/transport/http/plg_tier.go` → `planFromClaims`).
2. **Header `X-Tribia-Plan`:** enviado pelo cliente; combinado com o JWT via **`MostRestrictivePlan`** — o header **não eleva** o tier acima do JWT (excepto modo `TRIBIA_TRUST_PLAN_HEADER` quando o JWT não traz plano).
3. **Dev / skip de auth:** fluxos com `X-User-ID` podem usar o header de forma mais directa (ver `resolvePlgUserAndTier`).

**Implicação:** o utilizador pode ver **Premium** na UI (metadata Clerk) mas o backend continuar a tratar como **Free** se o token não incluir `tribia_plan` — típico de **template de sessão JWT** mal configurado no Clerk.

---

## 3. Matriz de capacidades (`tribia-plg-flags.ts`)

| Capacidade (`TribiaPlgCapabilities`) | Free | Pro | Premium |
|-------------------------------------|:----:|:---:|:-------:|
| `rayxFull`                          | —    | ✓   | ✓       |
| `boardReadyUnlocked`                | —    | ✓   | ✓       |
| `historyRichPreview`*               | —    | ✓   | ✓       |
| `compareAB`                         | —    | ✓   | ✓       |
| `legalOpinionTab`                   | —    | —   | ✓       |
| `whiteLabelExport`                  | —    | —   | ✓       |
| `collectiveIntel`                   | —    | —   | ✓       |
| `complianceRadar`                   | —    | —   | ✓       |
| `freeWatermark`                     | ✓    | —   | —       |

\*A página de histórico usa `plgTier === "pro" || plgTier === "premium"` (`historyPro`), equivalente a `historyRichPreview`.

---

## 4. Diferenças visuais por zona da interface

### 4.1 Barra superior (`tribia-top-nav.tsx`)

| Elemento | Free | Pro | Premium |
|----------|------|-----|-----------|
| **`PlgLimitMeter`** | Visível **só** se `GET /plg/quota` reportar enforcement activo e limite diário > 0: pill âmbar com “Simulações hoje: X/Y” e “Unlock Pro” quando esgotado. | **Não** renderiza (tier ≠ free). | Idem Pro. |
| **`TribiaPlanBadge`** | Pill neutro (“FREE”). | Pill com tom **emerald**. | Pill com tom **primary** (navy institucional). |
| **`LegalVersionIndicator`** | Popover/sheet: só changelog fiscal (`ChangelogFiscalPanel`). | Idem. | Idem **mais** faixas no topo do painel: **Compliance Radar** e **Inteligência colectiva** (copy de roadmap, não dados live). |

### 4.2 Simulador — modo apresentação (Board-Ready) (`dashboard/page.tsx`)

| Aspecto | Free | Pro / Premium |
|---------|------|----------------|
| Botão “Modo apresentação” | Ícone **cadeado**, `aria-label` indica disponibilidade no Pro; ao clicar abre **`BoardReadyTeaseSheet`**: pré-visualização desfocada, CTA “Ver planos Pro”. | Alterna **Modo apresentação** / **Modo edição**; ícones Presentation / Monitor. |
| Largura do conteúdo | Normal. | Com Board-Ready activo: `board-ready:max-w-5xl`. |
| **Marca d’água** (`BoardReadyWatermark`) | Visível com texto “Gerado por TribIA **Free**”. | Texto “Gerado por TribIA” (sem “Free”). |
| **Cabeçalho / impressão** (`BoardReadyHeader`, `PrintReportHeader`) | Marca TribIA padrão; rodapé impresso com ramo **Free** (ver §4.7). | Pro: masthead TribIA; rodapé “Pro” (sem linha Free, sem bloco confidencial white-label). |
| **Premium + white-label** | — | Com `whiteLabelExport` e metadata `branding_logo_url` / `branding_org_name`: cabeçalho impresso pode mostrar **logo ou nome do cliente**; linha “Simulação processada pelo motor TribIA” omitida quando white-label com logo. |

### 4.3 Comparar cenário (A/B) no dashboard

| Aspecto | Free | Pro / Premium |
|---------|------|----------------|
| Botão “Comparar cenário” | Abre **`PlgUpgradeDialog`** (`compare_ab`). | Inicia fluxo `startComparison` (congela A, permite B). |
| Comparação carregada do **histórico** | Se existir `pendingHistoryComparison` mas `compareAB` é falso: comparação é **descartada** e abre-se o mesmo diálogo de upgrade. | Hidrata store e entra em modo comparativo. |

### 4.4 Context Hub e Raio-X (`context-hub.tsx`, `context-highlight-field.tsx`)

| Aspecto | Free | Pro / Premium |
|---------|------|----------------|
| Realce no texto do contexto | `teaseRayxHighlight={true}`: trecho com **blur** e opacidade reduzida no *backdrop* do campo. | Realce **nítido** (âmbar). |
| Callout `#ray-x-anchor-callout` (briefing aberto, com âncora) | Fundo neutro; texto convida ao Pro; botão “Saiba mais” → `PlgUpgradeDialog` `rayx`. | Fundo **emerald** suave; confirma realce nítido abaixo. |
| Sem âncora única | Estado “missing” (âmbar): mensagem de heurística / briefing. | Idem (não depende do tier). |

### 4.5 Briefing de auditoria (`analyst-briefing-sheet.tsx`)

| Secção “Base legal” | Free | Pro / Premium |
|---------------------|------|----------------|
| Conteúdo | Bloco com **blur** e overlay com copy + link “Upgrade para Pro”. | Texto e lista de evidências **legíveis** (sem overlay). |

### 4.6 Resumo executivo (`comparison-verdict-card.tsx`)

| Elemento | Free / Pro | Premium |
|----------|------------|---------|
| Tabs “Veredito financeiro” / “Parecer jurídico” | **Ausentes** (só conteúdo do veredito). | **Presentes** no ecrã; em Board-Ready as tabs podem estar ocultas (`board-ready:hidden`) mas o parecer pode aparecer em **print** (`print:block`). |
| Conteúdo “Parecer jurídico” | — | Bloco “Rascunho assistido — Premium” (texto ilustrativo + nota de pipeline futuro). |

### 4.7 Impressão — rodapé (`print-report-chrome.tsx` → `PrintReportFooter`)

| Ramo | Condição | Conteúdo visual / copy |
|------|----------|-------------------------|
| **Free** | `plgTier === "free"` | Título “Simulação TribIA **Free**”, lei, simLine, “Auditado via RAG Engine”, aviso de limites do plano Free. |
| **Premium white-label** | `plgTier === "premium" && whiteLabel` | Rodapé “confidencial”, referência à LC 68/2024, **sem** menções de marca TribIA no mesmo tom do Free/Pro. |
| **Pro (e Premium sem ramo anterior)** | `else` (não free) | Lei, simLine, “Auditado via RAG Engine”, disclaimer genérico de simulação (sem selo “TribIA Free”). |

### 4.8 Histórico (`app/dashboard/history/page.tsx`)

| Aspecto | Free (`historyPro === false`) | Pro / Premium |
|---------|-------------------------------|---------------|
| Subtítulo da página | Texto focado em lista + pré-visualização suave da trajetória. | “Arquivo activo”, sparklines, Time-Traveler, comparação de dois cenários. |
| Duas linhas seleccionadas | Banner neutro + “Conhecer no Pro” → `PlgUpgradeDialog` `compare_ab`. | Banner **emerald** + botão **Comparar cenários** (carrega registos e navega para o dashboard em modo A/B). |
| Linha da tabela | Sparkline com **opacity-40**, rótulo “Pro”, **sem** tag de economia/carga interactiva à direita; **sem** pill de Δ; contexto truncado a **72** caracteres. | Sparkline + **EconomyScanTag** + **Δ** com cores semânticas; contexto **48** caracteres; hover preview rico (`HistoryRowHoverPreview` só desktop Pro). |
| Botão **i** (preview) | Variante `free-tease` (`HistoryTimeTravelerPreviewBody`). | Variante `pro` (trajetória e insight completos). |

### 4.9 Fluxos de *upgrade* (copy apenas)

- **`PlgUpgradeDialog`**: `compare_ab`, `board_ready`, `rayx`, `generic` — sem checkout; texto orienta suporte/administrador.
- **`BoardReadyTeaseSheet`**: *tease* visual do layout Board-Ready para Free.

### 4.10 Identidade visual resumida por tier

- **Free:** mais *muted*, cadeados, blur, watermarks, pills âmbar de quota, CTAs de upgrade.
- **Pro:** **emerald** como sinal de “capacidade desbloqueada” (comparar, histórico activo, callout Raio-X).
- **Premium:** **primary** no badge de plano; faixas extra no indicador LC 68/2024; separador “Parecer jurídico”; impressão white-label quando há branding no Clerk.

---

## 5. Diferenças funcionais (dados, API, cache)

### 5.1 Cabeçalhos e identidade nas chamadas

- **`tribiaPlanHeader(plan)`** (`src/lib/api.ts`): envia `X-Tribia-Plan` alinhado ao tier do hook em rotas que recebem `ClassifySimulatePlgOpts` / listagens — **empresa**, **simulação**, **quota**, **classificação em lote**, etc.
- **React Query:** chaves incluem `plgTier` onde o resultado depende do plano (ex.: `["companies", userId, plgTier]`) para não servir cache de um tier a outro.

### 5.2 Quotas e limites (Go, `internal/plg/plg.go`)

Activos **apenas** com `TRIBIA_PLG_ENFORCE=true` (ou `1`):

| Regra | Free | Pro | Premium |
|-------|------|-----|---------|
| Simulações completas por dia (pipeline) | Limitadas (`TRIBIA_FREE_SIM_DAILY_LIMIT`, default 3). | Ilimitadas no limitador. | Ilimitadas. |
| Máximo de **empresas** (templates) | `TRIBIA_FREE_COMPANY_LIMIT` (default 3). | `TRIBIA_PRO_COMPANY_LIMIT` (default 30). | **Sem teto** (`CompanyCreateAllowed` devolve sempre permitido). |

**Persistência:** contadores de simulação diária são **em memória** no processo Go — adequado a demo/portfolio; reinício do servidor zera contagens.

### 5.3 Endpoints afectados (visão de alto nível)

- **`GET /plg/quota`:** devolve `plan`, `simulations_today`, `daily_limit` (só relevante para Free), limites de empresa, `enforcement_enabled`.
- **Criação de empresa:** verifica teto antes de criar (`handler_company.go`).
- **Pipeline de simulação / classificação:** `checkPipelineQuota` antes de processar; `recordSimulationPlg` incrementa contador para Free após sucesso.

### 5.4 O que **não** muda por tier (no código actual)

- Lógica **determinística** do motor de simulação e **RAG** por si só não bifurca por plano no frontend; o tier afecta **acesso à UI**, **quotas**, **metadados de impressão** e **tabs** jurídicas.
- Não existe integração **Stripe** nem webhook que altere `tribia_plan` automaticamente.

---

## 6. Mapa rápido ficheiro → responsabilidade PLG

| Ficheiro | Função |
|----------|--------|
| `src/lib/tribia-plg-flags.ts` | Matriz canónica de capacidades. |
| `src/components/tribia/tribia-plan-provider.tsx` | Resolução Clerk + env. |
| `src/components/tribia/plg-limit-meter.tsx` | Quota visual Free. |
| `src/components/tribia/tribia-plan-badge.tsx` | Selo de plano na top bar. |
| `src/app/dashboard/page.tsx` | Board-Ready, watermark, comparar, impressão, `plgTier` no veredito. |
| `src/app/dashboard/history/page.tsx` | Histórico rico vs tease. |
| `backend-engine-go/internal/plg/plg.go` | Limites numéricos. |
| `backend-engine-go/internal/transport/http/plg_tier.go` | JWT + header. |
| `backend-engine-go/internal/transport/http/handler_plg.go` | Quota HTTP + pipeline. |

---

## 7. Glossário

- **Raio-X:** realce do trecho do contexto alinhado ao briefing (chip/classificação) + legibilidade da base legal no painel lateral.
- **Board-Ready:** modo apresentação com tipografia de relatório, layout focado em conselho e impressão.
- **White-label (Premium):** uso de `branding_*` no Clerk + flags de exportação para masthead/rodapé orientados ao cliente.

---

*Última revisão alinhada ao repositório na data de criação deste ficheiro; em caso de divergência, prevalece o código.*
