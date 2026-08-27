# Arquitetura do Frontend — Direção de Refatoração

Data-base: 26/08/2026 (rev. 2). Companion do plano de evolução (`../../docs/plano-evolucao-tribia.md`). Objetivo: preparar o `frontend-next` desde a base para tudo o que a plataforma vai ser capaz de fazer (parecer auditável, caixa/split payment, plano de ação, fornecedores, repricing, import XML/SPED, carteira multi-CNPJ), sem big bang.

As fases de desenvolvimento estão na seção 12; riscos na 13; decisões em aberto na 14.

## 1. Estado atual — o que preservar e o que dói

**Preservar (está certo):**
- TypeScript `strict`, quase zero `any`; `types/api.ts` como espelho dos DTOs do Go.
- `lib/` com lógica pura e testável (16 suites) separada do React.
- TanStack Query para estado de servidor, zustand para UI; `ApiError` com `request_id` correlacionável.
- Design system documentado e vivo (`.interface-design/system.md`), tokens OKLCH.
- Invariantes de domínio bem documentadas (contrato do `consultant_override`, semântica de delta).

**Dói (e vai doer mais a cada módulo novo):**
- `src/app/dashboard/page.tsx` com ~1.100 linhas orquestrando o pipeline inteiro (~15 `useState`/`useCallback` interligados). Cada feature nova hoje entraria aí.
- `components/tax/` com ~80 componentes sem fronteira de feature — não se sabe o que pertence a quê.
- Pipeline (classificar → calcular → persistir → recalcular) acoplado à página; o recálculo vive num "bridge" paralelo (`simulation-recalc-bridge.tsx` + `use-simulation-recalc.ts`).
- `lib/` virou saco de tudo: dos ~60 arquivos, uns 40 são lógica de **uma** feature (`transition-*`, `rag-*`, `classification-*`, `history-*`, `law-*`) — só o resto é de fato compartilhado.
- Gating PLG espalhado em `if`s pelos componentes (~13 flags em `tribia-plg-flags.ts` + `components/tribia/`).
- `FISCAL_LAW_CHANGELOG` hardcoded no cliente (sai com a API de corpus do backend — W1).
- Entrada CSV acoplada (um único caminho de parse); PT-PT e PT-BR misturados; zero teste de componente/E2E (vitest só roda `*.test.ts` em ambiente `node`); migração `slate-*`→tokens inacabada.

## 2. Princípios de arquitetura

1. **Feature modules.** Cada capacidade da plataforma é um módulo autocontido (UI + hooks + api + tipos + testes). Rotas são finas: `page.tsx` < 100 linhas, só composição.
2. **O pipeline é uma máquina de estados, não uma página.** Etapas declaradas e extensíveis; a UI apenas renderiza o estado.
3. **Entrada é plugável.** Um contrato de `Importer` — formulário, CSV, XML NF-e, SPED entram sem tocar no pipeline.
4. **O dossiê é composição.** Seções registráveis; fases novas (caixa, plano de ação, fornecedores) só adicionam seções.
5. **Entitlements num único lugar.** Capabilities por módulo, consumidas declarativamente.
6. **Estado de servidor por domínio.** API clients e query keys por domínio, invalidação previsível.
7. **Uma língua (PT-BR), um token system.** Padronizar ao tocar cada arquivo (regra do escoteiro) — exceto em PRs de move (ver seção 12, regra "mover ≠ reescrever").
8. **Fronteira lintada, não combinada.** A regra de dependência e o teto de linhas viram regra de ESLint na fase FE-0; o que o lint não pega, o review não segura.

## 3. Estrutura alvo

```
src/
├─ app/                          # rotas finas, só composição
│  ├─ dashboard/                 # hoje; evolui para clientes/[companyId]/…
│  ├─ report/[id]/
│  └─ api/…                      # proxy público same-origin → features/report/api
├─ features/
│  ├─ simulation/                # máquina do pipeline, formulário, resultados,
│  │  ├─ machine/                #   histórico de registros (dashboard/history consome daqui)
│  │  ├─ components/
│  │  ├─ hooks/
│  │  └─ api.ts
│  ├─ classification/            # visões RAG, evidências, override do consultor
│  ├─ report/                    # dossiê: registry de seções, board-ready, print
│  ├─ import/                    # registry de importers (form, csv, xml-nfe, sped)
│  ├─ cash-flow/                 # W3 — split payment, capital de giro
│  ├─ pricing/                   # W6 — repricing/margem
│  ├─ suppliers/                 # W5 — análise de fornecedores
│  ├─ action-plan/               # W4 — plano de ação prescritivo
│  ├─ portfolio/                 # W9 — carteira multi-CNPJ (dashboard/companies evolui p/ cá)
│  ├─ legal-corpus/              # W1 — artigos, data-base, changelog vindo da API
│  └─ plg/                       # entitlements (move de components/tribia + hooks de plano)
├─ lib/                          # SÓ lógica pura compartilhada entre 2+ features
│                                #   (http, money-decimal, format-money, utils, platform, theme)
├─ components/
│  ├─ ui/                        # primitivos shadcn (como está)
│  └─ shell/                     # chrome do app (como está)
├─ store/                        # só estado de UI global (tema, painéis do shell);
│                                #   estado de pipeline sai do useTaxStore p/ a máquina
└─ types/                        # contrato com o backend (espelho dos DTOs)
```

Regra de dependência: `app → features → lib/components/types`. Feature não importa de outra feature — o que duas features compartilham desce para `lib/` ou vira contrato explícito.

**Nota sobre `lib/`:** a lógica específica de feature migra **junto com a feature**, levando os testes. O `lib/` final é pequeno e estável.

**Atualização pós-FE-2:** a execução revelou que nem toda lógica "de feature" tem dono único — algumas peças são consumidas por 2+ features e por isso **ficam** em `lib/` (ou sobem a `components/shared/`) em vez de migrar, mesmo quando o nome sugere um domínio só. Cada caso foi decidido por consumidor real, não por nome do arquivo:
- **Tipos-contrato entre camadas:** `lib/report-contract.ts` (o `ReportSection` da seção 6 — só pode importar `types/api` e tipos, nunca `features/report`, porque `features/simulation` e `features/classification` também o consomem), `lib/persisted-results.ts` (`PersistedResults`/`ResultMeta` — `lib/history-hydrate.ts`, base, precisa deles tanto quanto a máquina), `lib/company-regime.ts`, `lib/tribia-plg-flags.ts` (só tipos; a implementação de `getPlgCapabilities` é que vive em `features/plg/`).
- **Lógica com consumidor cruzado report/classification/simulation:** `lib/confidence-tiers.ts`, `lib/rag-metadata.ts`, `lib/classification-effective.ts`, `lib/comparison-metrics.ts`, `lib/simulation-verdict.ts`, `lib/rag-hero-article-heuristic.ts`, `lib/legal-highlight-segments.ts`, `lib/law-pdf-external-url.ts`, `lib/law-article-from-classification.ts`, `lib/aggregate-solidity-diagnostic.ts`, `lib/history-hydrate.ts`, `lib/session-labels.ts`, os 5 `lib/transition-*`, `lib/fiscal-law-changelog.ts`.
- **Presos por consumidor fora de `features/` (shell, store):** `lib/simulation-line-helpers.ts` (`CommandMenu`), `lib/context-rune-span.ts` (`useTaxStore`), `lib/strategy-tags-match.ts`.
- **`components/shared/` ganhou o mesmo tratamento** para componentes React na mesma situação: `solidity-aggregate-diagnostic`/`solidity-traffic-light` (usados por `features/report` e teriam criado aresta report→classification), e toda a cadeia da Cédula de auditoria — `expense-table`, `expense-evidence-columns`, `line-evidence-popover-body`, `classification-briefing-content`, `law-article-integral`, `ray-x-anchor-callout` (usados por `features/classification` **e** por `features/simulation` via `dashboard-csv-view.tsx`).

Regra geral aplicada nas PRs 2d–2f: antes de mover um arquivo para dentro de uma feature, `grep` de todos os importadores reais; se algum vive fora da feature-alvo (e fora de `app/`), o arquivo fica em `lib/`/`components/shared/` em vez de migrar — o nome do arquivo não é evidência do domínio.

**Atualização pós-FE-3:** `features/import/` (PR 3c) e `features/legal-corpus/` (PR 3e) deixam de ser aspiracionais — existem. `lib/importer-contract.ts` entra na lista de tipos-contrato acima (mesmo racional do `report-contract.ts`: `features/import` implementa, `features/simulation` renderiza via render-prop, `app/` compõe). `components/legal/` deixou de existir — migrou inteiro para `features/legal-corpus/components/`. Candidato a move futuro (não feito na FE-3, fora de escopo): a cadeia da Cédula de auditoria (`expense-table` e afins) hoje em `components/shared/` só é consumida por `features/classification` desde que o fork CSV de `features/simulation` foi dissolvido (PR 3c) — vale reavaliar se ainda precisa ficar em shared.

## 4. Camada de dados

**Implementado desde a FE-1** (não é mais trabalho futuro): `lib/api.ts` não existe — foi quebrado em `lib/http.ts` (núcleo: `API_BASE`, `ApiError`, `throwApiError`, `authHeaders`, `tribiaPlanHeader`) + `lib/api/{simulation,companies,legal,classification,plg,strategy-tags,query-keys}.ts` (clients por domínio), com um barrel de compatibilidade em `lib/api/index.ts` (`@/lib/api` continua resolvendo os mesmos símbolos — zero mudança de import nos consumidores). A localização real diverge do `features/*/api.ts` cogitado abaixo — os clients ficaram em `lib/api/`, não migraram para dentro de cada feature; não há indicação de que valha a pena mover agora.

- **Query keys convencionadas:** `[domínio, entidade, ...params]` em `lib/api/query-keys.ts` — única fonte, zero literal espalhado (`queryKeys.companies.all`, `.simulationRecords.list(userId, limit)`, `.lawCorpus.all`, etc.). Diverge do exemplo original (`['simulation-records', 'detail', id]`): não há keys `detail` — `getSimulationRecord`/`getPublicSimulationRecord` são chamados imperativamente, fora do TanStack Query (candidato a alinhamento futuro, não crítico).
- **Interceptor PLG → capability**: implementado na FE-3 (PR 3a) — `setPlgLimitListener` em `lib/http.ts` (registro de callback; `lib/` não importa `features/plg`) + `features/plg/components/plg-limit-dialog-host.tsx` (monta em `components/providers.tsx`). Um 403 com `code` no corpo (quota/limite) abre o `PlgUpgradeDialog` central, venha do caminho da máquina do pipeline ou de um `useQuery`/mutation. Os diálogos manuais por capability (clique em recurso bloqueado, antes de qualquer request) continuam existindo à parte — caso distinto do 403 de rede.
- **Contrato:** manter `types/` espelhando os DTOs por ora; quando o backend ampliar o `openapi.yaml` (hoje cobre 2 de ~17 rotas), avaliar geração de tipos a partir do spec — o espelho manual é o maior risco silencioso de drift (decisão em aberto, seção 14).
- Valores monetários seguem trafegando como **string decimal** — nenhuma feature converte para `number` fora de `lib/` (decimal.js).

## 5. O pipeline como máquina de estados

Extraída de `dashboard/page.tsx` + `use-simulation.ts` + `simulation-recalc-bridge.tsx` para `features/simulation/machine/` na FE-1; o registry real de passos chegou na FE-3 (PR 3b). Grafo real:

```
idle → running(stepId do PIPELINE_STEPS, acc) → ready
              ↑______________ recalc (override) ______↓
```

- **Registry real** (`step-registry.ts`): `PIPELINE_STEPS: readonly Step[]` — hoje `[classifyStep, simulateStep]`. `Step = { id, uiStage, run(input, acc, ctx) }`; `run` devolve `StepOutcome = {ok:true, acc} | {ok:false, error}`. A máquina não conhece nomes de passo — `transition.ts` encadeia pela **ordem do array**, não por literal (provado em `transition.test.ts` com um registry fake de N passos). Um passo novo (`validating-rfb`, W7; `parsing-xml`, W8) é **uma linha** em `PIPELINE_STEPS` + sua implementação em `steps.ts` — nada no reducer, no executor (`machine-store.ts`) ou na página muda.
- **`PipelineAcc`** é o canal explícito entre passos (`{classified?, discoveredTags?, results?}`) — substitui um canal implícito e frágil que existia em `runtime.ts` (`setLastDiscoveredTags`/`setDossierReportBrand`, com uma ordem de execução documentada em comentário) e que foi removido na PR 3b. `results` é obrigatório no acc devolvido pelo **último** passo do registry — se faltar, o reducer trata como falha de contrato (rede de segurança contra um registry mal configurado).
- O recálculo debounced do override é uma **transição** da mesma máquina, ortogonal aos passos (nenhum caso de teste de override/recalc cita `classify`/`simulate`) — o bridge original morreu na FE-1.
- A UI consome um hook único (`use-simulation-pipeline.ts`): estado atual (`isRunning`, `runningStepId`, `runningUiStage`), resultado, falha, ações. `use-pipeline-stage.ts` (PR 3d) deriva o estágio de UI direto de `runningUiStage` — o vocabulário de UI é literalmente o mesmo tipo (`PipelineUiStage`) que cada `Step` declara, não uma union paralela.
- A máquina é lógica pura + efeitos isolados → testável com vitest sem browser.
- **Implementação:** reducer com union discriminada + registry de passos, à mão — sem XState (decisão fechada, seção 14). O grafo é linear com um ciclo; uma dependência nova não pagaria o próprio custo aqui.

## 6. Report engine (dossiê como composição)

Implementado na FE-2 (PR 2c) em `lib/report-contract.ts` (contrato) +
`features/report/report-renderer.tsx` (renderer). Forma real — mais rica que
o esboço original desta seção, com 3 modos de render e 4 valores de print
(não 3), porque a exploração encontrou 3 mecanismos paralelos coexistindo
(prop `presentationMode`, variant CSS `board-ready:*`, gate de montagem por
aba) que o registry unificou:

```ts
type ReportRenderMode = "screen-tabs" | "board" | "public-linear"
// screen-tabs: dashboard logado fora do Board-Ready — monta só a secção da
// aba activa. board: dashboard logado em modo apresentação — monta tudo.
// public-linear: /report/[id] — monta tudo, sem tabs.

type ReportPrintMode = "always" | "board-only" | "print-only" | "never"
// always: participa do fluxo normal de impressão. board-only: só monta em
// mode==="board", CSS `board-ready:* print:hidden` (watermark fica fora do
// papel por decisão deliberada, não bug). print-only: sempre montada, CSS
// `hidden print:*`. never: chrome interactivo, nunca aparece na impressão.

type ReportScreenTab = "veredito" | "cronograma" | "dossie" | "mesa"

interface ReportSection {
  id: string
  title: string
  capability?: CapabilityName    // gating PLG declarativo — secção não monta se false
  print: ReportPrintMode
  screenTab?: ReportScreenTab    // ausente = chrome (masthead/rodapé), sem aba própria
  Component: ComponentType<ReportSectionProps>
}
```

- O dossiê (`/report/[id]` e a visão logada) itera um **registry de seções**; board-ready e impressão viram *modos de render*, não componentes paralelos. As duas páginas (`app/dashboard/page.tsx`, `app/report/[id]/public-report-page.tsx`) compõem a lista a partir de `features/report` + `features/classification` (`classificationReportSections`) — nenhuma feature importa a outra; só `app/` cruza.
- `dashboard-results-view.tsx` (features/simulation) não importa `features/report`: recebe um `renderDossier` *render-prop* injectado por `app/dashboard/page.tsx`, que constrói o `ReportRenderInput` e chama `<ReportRenderer sections={...} />`. Mesma razão do lado público: `app/report/[id]/page.tsx` (Server Component, só para `generateMetadata`) delega a um wrapper `"use client"` — passar a lista de secções (que carrega referências de componente) como prop de Server para Client Component falha em runtime ("Functions cannot be passed directly to Client Components"), erro que só apareceu correndo o servidor (E2E), não no `next build`.
- Fases novas adicionam seções sem tocar no shell do dossiê: memória de cálculo (W2), impacto no caixa (W3), plano de ação (W4), fornecedores (W5), selo de validação RFB (W7), data-base do corpus (W1).
- Registros antigos continuam abrindo: o registry recebe o record já enriquecido pelo backend (`enrichTransitionSeriesLegacy`); seção sem dados no snapshot não renderiza — nunca quebra (coberto por smoke test com registo mínimo/antigo em `features/report/report-renderer.test.tsx` e `features/classification/sections/sections.test.tsx`).

## 7. Importers plugáveis

Implementado na FE-3 (PR 3c). Forma real — diverge do esboço original desta
seção num ponto de design deliberado: **o formulário manual não é um
importer**. Um importer produz um **rascunho** (`SimulationDraft`), não um
`SimulationInput` completo — ele não sabe montar contexto/regime da empresa,
só dados de linha (serviços/despesas). O usuário sempre completa e simula
pelo formulário; import é "preencher", não "rodar".

```ts
// lib/importer-contract.ts — camada base, só types/api + tipos React
interface SimulationDraft {
  services?: FormService[]
  expenses?: FormExpense[]
  companyContext?: string
  year?: number
}

type ImporterParseResult =
  | { ok: true; draft: SimulationDraft; warnings?: string[] }
  | { ok: false; error: string }

interface ImporterDefinition {
  id: string                     // "csv" | futuros "xml-nfe" | "sped"
  label: string                  // rótulo no seletor de modo
  accepts: readonly string[]     // extensões/mime do <input accept>
  formatHint?: string
  parse(content: string, opts?: { fileName?: string }): ImporterParseResult | Promise<ImporterParseResult>
  Picker?: ComponentType<ImporterPickerProps>   // ausente = zona de upload genérica
}

interface ImporterPanelEntry {
  id: string
  label: string
  render(props: ImporterPickerProps): ReactNode
}
```

- **Registry** em `features/import/registry.ts` (`IMPORTERS: readonly ImporterDefinition[]`) — hoje só `csvImporter`. Um importer novo (XML NF-e, W8; SPED, W8-etapa-2) é uma linha aqui + a implementação em `importers/`.
- **`parse` é puro e síncrono/testável sem DOM** — recebe o conteúdo já lido como string (`Papa.parse` em modo string não usa `FileReader`/worker), não um `File`. Quem lê o arquivo é `features/import/components/file-drop-zone.tsx` (zona de upload genérica; um importer com UI própria — ex.: XML NF-e com drag-and-drop de pasta — define `Picker` e a zona genérica não é usada).
- **`features/simulation` não importa `features/import`** (feature ↛ feature): as entries chegam prontas via `importerEntries: ImporterPanelEntry[]`, injetadas por `app/dashboard/page.tsx` (`getImporterPanelEntries()` do barrel) — mesmo padrão render-prop do `renderDossier` (seção 6). `features/simulation/components/dashboard-input-panel.tsx` só renderiza `entry.render({onApplied})`.
- **Aplicação do rascunho**: `features/import/lib/apply-draft.ts` (`applyDraftToStore`) escreve no `useTaxStore` — só os campos presentes no draft substituem o valor correspondente; ausentes ficam intactos. Depois disso o fluxo é o formulário normal: usuário completa, roda a simulação, a máquina classifica com contexto real (envia `client_id`, persiste, gera tags) — ao contrário do fork CSV classify-only que existiu até a PR 3c.

## 8. Entitlements (PLG)

- `features/plg/` vira a única fonte: plano (Clerk metadata) → `capabilities` → consumo declarativo:
  - `<RequireCapability cap="cashFlow" fallback={<UpgradeCard/>}>…</RequireCapability>`
  - `useCapability('compareAB')` para lógica.
- Migram para cá: os ~13 flags de `tribia-plg-flags.ts`, `components/tribia/` (meter, dialog, badge, provider) e os hooks `use-plg-quota`/`use-tribia-plg-tier`.
- Erros 403-com-código do backend continuam virando diálogo de upgrade, mas num único interceptor do client HTTP (`lib/http.ts`).

**Estado pós-FE-2 (PR 2b):** o interceptor 403→diálogo descrito acima **não existia** — nem antes nem depois da FE-2. A exploração confirmou que nenhum código lia `ApiError.code`; os diálogos de upgrade (`PlgUpgradeDialog`) eram disparados só manualmente pelos componentes (ex.: ao clicar "Comparar cenário" sem `compareAB`). Registado então como trabalho futuro, não escopo da FE-2: a fase entregou `features/plg/` (provider, `useCapability`, `CapabilityProvider`, `RequireCapability`) e a migração dos ~10 `if`s crus de tier + 2 flags mortas religadas (`historyRichPreview`, `legalOpinionTab`), mas não tocou a camada HTTP.

**Correção factual (a nota acima citava `lib/http.ts` como inexistente — falso já naquele momento):** `lib/http.ts` existe desde a FE-1 (ver seção 4) — o que faltava era só o interceptor 403→diálogo em si, não o arquivo. **Implementado na FE-3 (PR 3a):** `lib/http.ts` expõe `setPlgLimitListener` (registro de callback — `lib/` não pode importar `features/plg`, a ligação é por callback, não por import); `throwApiError` chama o listener registrado sempre que classifica um 403 como `isPlgLimit`. `features/plg/components/plg-limit-dialog-host.tsx` se auto-registra e abre o `PlgUpgradeDialog` central — montado em `components/providers.tsx`, cobre tanto o caminho da máquina do pipeline quanto `useQuery`/mutations, porque todos os clients passam por `throwApiError`. Os diálogos manuais por capability (upsell clicado antes de qualquer request) continuam existindo à parte — caso distinto do 403 de rede vindo do servidor.

## 9. Rotas e navegação (preparando W9)

- Hoje: `/dashboard`, `/dashboard/history`, `/dashboard/companies`.
- Alvo: `/clientes` (carteira) → `/clientes/[companyId]` (visão do cliente) → `/clientes/[companyId]/simulacoes/[id]` (dossiê). `/dashboard` mantém redirect.
- A URL carrega o contexto do cliente — elimina estado global de "empresa selecionada" e prepara comparativos de carteira.
- Command palette (cmdk) ganha navegação por cliente.
- Atenção: `src/proxy.ts` (Clerk) protege `/dashboard(.*)` — as rotas novas entram na matcher **antes** do redirect, e `/report/*` segue público.

## 10. Padronização

- **Idioma:** PT-BR único em UI e código novo ("usuário", "atual", "arquivo"); corrigir PT-PT ao tocar o arquivo — exceto em PRs de move (seção 12).
- **Tokens:** terminar a migração `slate-*` → tokens (a lista pendente já existe em `.interface-design/system.md`); nenhum hex/emoji-cor novo fora dos tokens.
- **Arquivos grandes:** teto prático de ~300 linhas por componente; `transition-chart.tsx` (833) e `expense-semantic-audit-table.tsx` (770) quebram quando forem tocados.
- **Next 16:** antes de escrever código de framework (rotas, proxy, cache, RSC), consultar `node_modules/next/dist/docs/` — esta versão tem breaking changes vs. memória de treinamento.

## 11. Estratégia de testes

A rede de segurança vem **antes** da migração, não depois (é a fase FE-0):

- **Vitest em dois projetos** (`projects` no `vitest.config.ts`): o atual (`environment: node`, `src/**/*.test.ts`) intocado — as 16 suites de `lib/` continuam como estão; um novo (`environment: jsdom` + Testing Library, `src/**/*.test.tsx`) para componentes e hooks com DOM. `passWithNoTests` é opção de nível raiz no vitest 4 (não existe por projeto).
- **E2E:** 1 fluxo Playwright smoke (formulário → classificação → resultado → dossiê) com backend mockado por **interceptação de rede do Playwright** (`page.route`), não MSW — todas as chamadas do app partem do browser (inclusive o dossiê público, que busca same-origin), então um `page.route` por origem cobre o fluxo inteiro sem dependência nova. MSW fica para quando os testes de componente (jsdom) precisarem de handlers reutilizáveis.
- **Auth do E2E offline:** bypass de teste (`NEXT_PUBLIC_E2E_AUTH_BYPASS`) que pula `auth.protect()` no `src/proxy.ts` e troca `useAuth`/`useUser`/`SignInButton`/`UserButton` do Clerk por um seam fake em `src/lib/auth-client.tsx` — sem chaves Clerk, sem rede. Fail-safe **estrutural**, não disciplina de configuração: a flag exige `NODE_ENV !== "production"`, e `next build` roda sempre com `NODE_ENV=production`, então o ramo fake é dead code eliminado em qualquer artefato de produção (verificado: os tokens fake não aparecem em nenhum `.js` do build, só em source maps). Consequência aceita: o webServer do Playwright sobe via `next dev`, não `build+start` — o CI valida o build de produção num step à parte. O seam é a única porta para `@clerk/nextjs` fora de `proxy.ts`/`layout.tsx`/`app/page.tsx` (landing, server-side, fora do smoke) — a regra de fronteira (abaixo) bane import direto do Clerk em `hooks/`, `components/`, `app/dashboard/` e `features/`.
- **Máquina do pipeline:** vitest puro (transições, erros por etapa, recalc) — o teste mais valioso do app, nasce junto com a máquina (FE-1).
- **Componentes de feature:** mínimo por feature migrada: override→recalc, gating PLG, seções do dossiê.
- CI (W10) roda lint + testes (unit e E2E) + build em todo PR, nos dois projetos.

## 12. Fases de desenvolvimento

Estratégia de estrangulamento: cada fase termina com o app funcionando e deployável, e tem um **gate de saída verificável** — não se abre a fase seguinte com o gate anterior aberto. Dentro de cada fase, as entregas podem ser paralelas.

**Regra transversal — mover ≠ reescrever:** um PR ou move arquivos (`git mv` + ajuste de imports, zero mudança de comportamento, diffs revisáveis), ou muda comportamento. Nunca os dois. Correções PT-PT e migração de tokens só em PRs de comportamento.

### FE-0 — Rede de segurança e guardrails

Antes de mover qualquer linha.

| Entrega | Detalhe |
|---|---|
| Vitest em dois projetos | node (atual, intocado) + jsdom/Testing Library p/ `*.test.tsx` |
| Playwright smoke | formulário → classificação → resultado → dossiê, backend mockado via `page.route` (não MSW) |
| Bypass de auth E2E | `NEXT_PUBLIC_E2E_AUTH_BYPASS` + seam `src/lib/auth-client.tsx`; morto por construção em `next build` |
| Lint de fronteira | `no-restricted-imports` core (zero dependência nova — alias `@/` já é universal, 610/610 imports): feature ↛ feature, camadas não importam de cima, Clerk só via o seam; teto de linhas (300, warning) |
| CI nos PRs | dois jobs (`checks`: lint + typecheck + testes + build; `e2e`: Playwright) — entrega o essencial do W10 no frontend |

**Gate:** smoke verde no CI; regra de import ativa — allowlist de 3 inversões pré-existentes via `eslint-disable-next-line` auditado (`reportUnusedDisableDirectives: "error"` garante que só encolhe), zero arquivos novos violando.
**Depende de:** nada. **Destrava:** todas as fases seguintes com segurança.

### FE-1 — Fundação: máquina e camada de dados

| Entrega | Detalhe |
|---|---|
| Máquina do pipeline | extraída de `page.tsx` + `use-simulation` + bridge (seção 5); recalc vira transição; bridge deletado; estado de pipeline sai do `useTaxStore` |
| Testes da máquina | transições, erro por etapa, recalc — vitest puro |
| `lib/http.ts` + clients por domínio | quebra de `lib/api.ts` (seção 4); interceptor PLG único |

**Gate:** `dashboard/page.tsx` < 200 linhas; zero mudança de comportamento visível fora das declaradas abaixo (smoke + override-recalc E2E verdes); `simulation-recalc-bridge.tsx` não existe mais.
**Depende de:** FE-0. **Destrava:** FE-2 (os moves passam a ter um destino com dono).

**Implementado em `src/features/simulation/machine/`** (reducer à mão + registry de passos, sem XState — decisão fechada): estado union discriminada (`idle | classifying | calculating | ready`), store zustand vanilla de módulo (sobrevive a navegação — `history/page.tsx` hidrata e faz `router.push`), timer de debounce único (elimina a corrida entre a instância da página e a do bridge que existia antes). Persist unificado em `runPersist` (`origin: initial | recalc | dossier`) sobre `build-record-payload.ts` (movido de `lib/`, estendido com `discoveredTags`).

**Mudanças deliberadas de comportamento** (decisão do usuário na entrevista da fase):
1. Save pós-recalc agora invalida `simulation-records` + `plg-quota` (antes não invalidava nada — inconsistência com o fluxo principal).
2. Save pós-recalc loga erro (`console.error`) em vez do `catch {}` vazio original.
3. `HYDRATED` (abrir um registro do histórico) reseta `pendingSync` — não herda o badge de sincronização pendente de uma sessão anterior.
4. Timer de debounce único elimina por construção a corrida entre `simulation-recalc-bridge` e `recalculateAndWait` do dossiê (double-POST latente).

**Bugs preservados bug-for-bug** (não corrigidos nesta fase — candidatos a correção consciente, com issue própria, quando o arquivo relevante for tocado novamente):
- Erros de persistência do dossiê ficam só em `console.error`, sem superfície na UI.
- Em modo Board-Ready (apresentação), overrides ficam pendentes sem CTA manual de sincronização — o texto "Sincronizar Parecer" citado em comentários do código original nunca existiu como componente.
- Se o `POST /simulations` do recálculo falhar, `pendingSync` fica `true` indefinidamente (sem retry nem mensagem de erro visível).
- O atalho de teclado `⌘Enter` do `CommandMenu` dispara a simulação sem checar se o dashboard está montado/na rota certa.
- Um override aplicado enquanto um recálculo já está em voo (`recalc: "in-flight"`) não reagenda o debounce — fica pendente até o próximo override ou até o recálculo em curso terminar.

### FE-2 — Modularização por domínio ✅ concluída

| Entrega | Detalhe |
|---|---|
| `features/` populado | moves por domínio, ordem real: limpeza/promoções → `plg` → registry do dossiê → `classification` → `report` → `simulation` (6 PRs, abaixo) |
| `features/plg` | `RequireCapability` + `useCapability`; flags, `components/tribia` e hooks de plano migram; `if`s espalhados morrem |
| Registry de seções do dossiê | board-ready e print viram modos de render (seção 6) |

**Gate (verificado):** `test ! -d src/components/tax` ✓; `grep` de comparação literal de tier fora de `features/plg/` vazio ✓; `grep` de `eslint-disable-next-line no-restricted-imports` em todo o `src/` vazio ✓ (o último, lib→components/tax em `tax-terms-parser.tsx`, resolvido na PR 2e); dossiê 100% via registry (as duas páginas só compõem listas de `ReportSection`) ✓; lint/typecheck/testes/build/E2E verdes a cada PR.
**Depende de:** FE-1. **Destrava:** W2 e W4 do plano de evolução (memória de cálculo e plano de ação entram como seções).

**As 6 PRs executadas** (cada uma: `git mv` + imports, ou comportamento — nunca as duas; verde antes do commit):

1. **2a — Limpeza e promoções.** Órfãos e wrapper morto deletados; CSS morto removido; 8 folhas partilhadas promovidas a `components/marketing|legal|shared/`; dead code em `audit-confidence-tabs.tsx` (11 imports, 2 props, 1 const, tipo duplicado); `CompanyRegimeOption`/`isImobiliarioRegime` → `lib/company-regime.ts`.
2. **2b — `features/plg`.** Neutro por tabela-verdade: `getPlgCapabilities` sai de `lib/tribia-plg-flags.ts` (que fica só com tipos) para `features/plg/capabilities.ts`; `useCapability`/`CapabilityProvider`/`RequireCapability` novos; 2 flags novas (`pdfLegislationPro`, `privacyWorkspace`); ~10 `if`s crus de tier convertidos, religando `historyRichPreview` e `legalOpinionTab` (mortas por prop nunca passada). Lint ganha a única excepção transversal: negação `!@/features/plg` nos groups de `components/`, `shell/`, `hooks/`, `features/` — nenhuma outra feature ganha essa excepção.
3. **2c — Registry do dossiê (a única PR de comportamento).** `simulation-results-top-down.tsx`, `simulation-public-report-view.tsx` e `audit-confidence-tabs.tsx` (1.343 linhas ao todo, 3 caminhos duplicados) dissolvidos em 13 secções + o renderer da seção 6. As 3 lacunas do PDF público preenchidas (masthead, tabela de transição, rodapé legal — antes só existiam no dashboard logado). Painel "Anatomia do resultado" (`SummaryCards`), antes inalcançável em screen-tabs (a aba externa nunca chamava "dados"), passa a viver na aba Cronograma — corrigido, não só movido, e por isso ganhou gate de capacidade `transitionFocusYear` (antes só afinava um sub-prop). `ComparisonVerdictCard`: `onEsteiraTabChange` passa a navegar de facto para a aba Dossiê (antes, no-op silencioso).
4. **2d — Move `classification`.** 6 componentes + 4 secções (as "donas classification" da PR 2c) + 3 lib. Descoberta durante o mapeamento de consumidores: `ExpenseTable` e toda a cadeia da Cédula de auditoria são usadas também por `features/simulation` (`dashboard-csv-view.tsx`) — promovidas a `components/shared/` em vez de `features/classification/components/` (ver seção 3).
5. **2e — Move `report`.** 21 componentes + 5 lib. Mesma descoberta: `board-audit-certificate`/`board-legal-coverage-shield` são "Board" no nome mas RAG/auditoria no domínio real (única consumidora é uma secção classification) → foram para lá; `board-ready-presentation-cta`/`board-ready-tease-sheet`/`print-button` são chrome do dashboard ao vivo, não secções do registry → foram para `features/simulation/components/`.
6. **2f — Move `simulation` + tipos + gate final.** Últimos 19 componentes + 2 lib + 3 hooks. `PersistedResults`/`ResultMeta` saem do `useTaxStore` (que fica só com "estado de UI global") para `lib/persisted-results.ts` — não para `features/simulation/machine/` como o plano original previa, porque `lib/history-hydrate.ts` também precisa deles e não pode depender de `features/` (ver seção 3). `lib/download-simulation-memory-csv.ts` removido: ficou 100% órfão desde a dissolução do Dialog "memória de cálculo" na PR 2c. `src/components/tax/` deixa de existir.

**Padrão recorrente nas PRs 2d–2f:** a lista de arquivos do plano original agrupava por *nome* ("board-\*", "print-\*"); o `grep` de consumidores reais, feito antes de cada `git mv`, revelou que o nome nem sempre coincide com o domínio real de uso. Nenhuma dessas correções mudou comportamento — só o destino do arquivo.

**Mudanças deliberadas de comportamento** (só na PR 2c, a única que não é move puro):
1. As 3 lacunas do PDF público (masthead, tabela de transição, rodapé legal) — declarado acima.
2. Painel Anatomia deixa de ser inalcançável em screen-tabs — declarado acima.
3. `ComparisonVerdictCard.onEsteiraTabChange` passa a navegar de facto — declarado acima.
4. `cobertura-legal-auditoria` (BoardLegalCoverageShield + BoardAuditCertificate) ganha gate `boardReadyUnlocked` — antes renderizava para qualquer tier com `confidence_score` presente.

**Preservados declarados** (identificados na exploração, decisão consciente de não corrigir nesta fase — candidatos a issue própria quando o arquivo for tocado de novo):
- Print fora do Board-Ready continua imprimindo só a aba activa do screen-tabs (limitação conhecida do modo `screen-tabs` do renderer, seção 6) — imprimir o dossiê completo sem entrar em Board-Ready exige montar todas as secções fora desse modo, fora do escopo da FE-2.
- Watermark Free (`BoardReadyWatermark`) é deliberadamente `print:hidden` — não aparece no papel, só na tela em Board-Ready. Comentário do componente, que dizia o oposto, corrigido na PR 2a.
- Upsell duplo: `PlgUpgradeDialog` (features/plg) e o `TeaseSheet` do Board-Ready cobrem o mesmo caso de uso por dois caminhos distintos; a feature `board_ready` de `PlgUpgradeFeature` nunca é usada; existem 3 links directos a `/#planos` fora do fluxo de diálogo. Registado, não resolvido.
- O Dialog "Certificado de memória de cálculo" (`TransitionAuditPanelBody` num `<Dialog>`, W2) nunca tinha botão que o abrisse — dead-in-practice desde antes da FE-2. Não recriado na dissolução da PR 2c (a máquina do dossiê agora é o registry; reintroduzir UI morta contradiria o próprio objectivo da fase). Fica para quando W2 (memória de cálculo) entrar como secção real.
- `isLoaded` do `TribiaPlanProvider` (features/plg) nunca é lido por nenhum consumidor — o fallback sem provider já cobre o caso "ainda a carregar". Registado, não removido (é parte do contrato do provider, não dead code isolado).

### FE-3 — Extensibilidade: as portas dos módulos novos ✅ concluída

| Entrega | Detalhe |
|---|---|
| Contrato `Importer` | rascunho (`SimulationDraft`) + registry em `features/import` (seção 7) — o CSV vira o primeiro importer real |
| Passos de pipeline plugáveis | registry real na máquina (`PIPELINE_STEPS`, seção 5) — `validating-rfb` (W7) e `parsing-xml` (W8) entram sem tocar no reducer/executor |
| `features/legal-corpus` | porta pronta com fallback estático; `GET /law/corpus` ativa com 1 linha quando o W1 entregar |
| Interceptor 403 PLG | não estava no escopo original da fase (era dívida da FE-1, ver seção 8) — entrou como PR 3a por ser pequeno e de alto valor |

**Gate (verificado, PR 3f):** 3 probes temporários provaram que uma seção de dossiê fake, um importer fake e um passo de pipeline fake tocam **só o arquivo do registry correspondente** (`git diff --stat` = 1 arquivo cada), com efeito real confirmado sob E2E (aba nova no dossiê, entry nova no seletor de import preenchendo o form, smoke completo passando com o passo extra no meio do pipeline) — os 3 revertidos após a verificação, nunca commitados. Greps de limpeza (papaparse só em `features/import`, `classifyBatch` só na máquina, zero `UploadZone`/`CLASSIFY_SUCCEEDED`/`PIPELINE_STAGES_ORDERED`, `components/legal/` inexistente) todos limpos. Lint/typecheck/testes/build/E2E verdes a cada PR.
**Depende de:** FE-2. **Destrava:** Fases 1–3 do plano de evolução (W3, W5, W6, W7-selo, W8-XML entram como `features/` novas seguindo a seção 15 de DoD); a entrega efetiva do corpus real ainda depende do W1 no backend.

**As 6 PRs executadas:**

1. **3a — Interceptor 403 PLG → diálogo central** (`481f801`, comportamento pequeno). `setPlgLimitListener` em `lib/http.ts` (registro de callback — lib/ não importa features/plg) + `PlgLimitDialogHost` em `features/plg`, montado em `components/providers.tsx`. Idempotente ao `retry: 1` das mutations.
2. **3b — Registry de passos na máquina** (`cf86cf4`, neutro). Detalhado na seção 5 — `classifying`/`calculating` viram um único status genérico `running(stepId, acc)`; `CLASSIFY_*`/`SIMULATE_*` viram `STEP_SUCCEEDED`/`STEP_FAILED` parametrizados; o canal implícito de `runtime.ts` morre em favor do `PipelineAcc` explícito. Zero mudança de comportamento observável (a UI já colapsava os dois status num "carregando" só).
3. **3c — Contrato Importer + CSV vira rascunho no formulário** (`ca9ccd1`, o PR de comportamento grande). Detalhado na seção 7 — o fork classify-only do CSV (`upload-zone.tsx` fundindo parse + `classifyBatch` num callback, contexto hardcoded, sem `client_id`, sem persistir) morre; `dashboard-csv-view.tsx`/`csv-summary.tsx` são deletados. `dashboard-input-panel.tsx` (novo) absorve o seletor de modo + banners, extraído de `simulation-dashboard.tsx` (645→529 linhas).
4. **3d — `use-pipeline-stage` deriva da máquina** (`74f7487`, comportamento pequeno). `PipelineStage` vira alias de `PipelineUiStage` (o mesmo tipo que cada `Step` declara em `uiStage`) — a UI para de ter um vocabulário de estágio paralelo e desconectado da máquina.
5. **3e — Porta `features/legal-corpus`** (`d07b504`, neutro). `lib/api/legal.ts` ganha o contrato `LawCorpusResponse`; `features/legal-corpus/use-law-corpus.ts` consome via `useQuery` com `enabled: LAW_CORPUS_API_ENABLED` (`false`) — zero rede, fallback devolve a `FISCAL_LAW_CHANGELOG` de sempre. `components/legal/` migra inteiro (`git mv`); a montagem no shell usa um **slot** (`app/layout.tsx` → `AppChromeShell` → `TribiaTopNav`), porque shell/ não pode importar features/ (exceto plg) — confirmado seguro sob E2E real (a lição da FE-2 era sobre referências de função em objetos, não elementos JSX via prop).
6. **3f — Gate mecânico + doc.** Os 3 probes (seção acima) + estas atualizações do documento.

**Mudanças de comportamento declaradas** (3a, 3c, 3d — as únicas PRs de comportamento):
1. Um 403 PLG com `code` abre o `PlgUpgradeDialog` central, venha de onde vier; os diálogos manuais por capability continuam existindo à parte (3a).
2. Upload de CSV preenche o formulário (rascunho) em vez de mostrar resultado classify-only imediato (3c).
3. Despesas importadas por CSV passam a ser classificadas com contexto real da empresa + regime, enviam `client_id`, persistem no histórico e geram strategy tags — antes nenhum dos quatro (3c).
4. Quota PLG de classificação passa a ser consumida no submit, não no upload — importar é grátis agora (3c).
5. O preview classify-only do CSV morre; erros de parse aparecem na própria zona de upload (3c).
6. Predicado de "linha preenchida" unificado com `.trim()` (`isFilledLine`) — havia 3 cópias sutilmente diferentes; linha só-espaços deixa de contar em qualquer uma (3c).
7. Ids de linha importada via `makeLineId()`, não índice (3c).
8. Atalhos "a"/"d" e quick actions do CommandMenu ficam disponíveis em qualquer aba do painel de entrada (form ou importer), não só na aba do formulário — a distinção que os gatava não existe mais fora do painel (3c).
9. Durante o run, compass/announcer mostram o passo real ("Classificação" vs. "Simulação") em vez de ambos mostrarem "Simulação" o tempo todo (3d).

**Preservados declarados:**
- `runRecalc`/`runPersist` continuam relendo `useTaxStore.getState()` em vez do input guardado na máquina — decisão consciente, e agora **consistente por construção**: como o CSV também popula o store (mudança 2 acima), os dois caminhos (form e import) alimentam a mesma fonte de verdade. Corrigir isso é escopo de uma fase futura, não da FE-3.
- Os 5 bugs preservados da FE-1 (erros de persistência só em `console.error`, sem CTA manual de sync em Board-Ready, `pendingSync` preso em falha de recalc, atalho `⌘Enter` sem checar rota, override durante recalc em voo não reagenda) seguem intocados.
- Upsell PLG duplo (TeaseSheet vs. `PlgUpgradeDialog`), `fetchLawArticle` (export morto, candidato a virar client de `features/legal-corpus` no W1), `applyCompanyTemplate` com `crypto.randomUUID()` (gerador de id diferente do `makeLineId()` do resto do form) — todos registados na FE-2, seguem como estavam.
- CSV aceita `.csv,.txt`; sem drag-and-drop real (herdado do `upload-zone.tsx` original).

### FE-4 — Escala e navegação (carteira)

| Entrega | Detalhe |
|---|---|
| Rotas `/clientes/[companyId]/…` | com redirects de `/dashboard`; matcher do `proxy.ts` atualizada; URL carrega o contexto do cliente |
| `features/portfolio` | `dashboard/companies` evolui p/ cá; command palette navega por cliente |
| E2E ampliado | override→recalc, gating PLG, dossiê público, navegação por cliente |

**Gate:** nenhum estado global de "empresa selecionada"; fluxos antigos redirecionam; suíte E2E verde.
**Depende de:** FE-2 (FE-3 não bloqueia). **Destrava:** Fase 4 do plano de evolução (W9 e SPED).

### Mapa fases × plano de evolução

| Fase FE | Destrava no plano | Depende do backend? |
|---|---|---|
| FE-0 | W10 (parte frontend) | não |
| FE-1 | — (fundação) | não |
| FE-2 | W2, W4 (seções do dossiê) | citações corretas vêm do W1 |
| FE-3 | W3, W5, W6, W7-selo, W8-XML | `GET /law/corpus` (W1) só p/ legal-corpus |
| FE-4 | W9, W8-SPED | rotas de carteira no backend |

## 13. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Refatorar enquanto move (diffs irrevisáveis, regressão silenciosa) | Regra "mover ≠ reescrever"; `git mv` para preservar history; smoke E2E no CI desde FE-0 |
| Quebrar dossiês antigos ao mudar shape de dados | Registry tolera seção sem dados; o enriquecimento legado continua no backend; teste com um snapshot antigo real na suíte do report |
| Next 16 com breaking changes (rotas, proxy, cache) | Consultar `node_modules/next/dist/docs/` antes de código de framework; mudanças de rota (FE-4) em PR próprio |
| `types/api.ts` drifta do Go durante o refactor | Espelho manual continua regra (atualizar os dois lados); typegen só quando o `openapi.yaml` cobrir as rotas (seção 14) |
| Lint de fronteira virar ruído (herança de violações) | Implementado: `eslint-disable-next-line no-restricted-imports -- herança FE-0: <aresta>` nas 3 linhas exatas (não `ignores` no arquivo inteiro — isentaria violações novas no mesmo arquivo) + `reportUnusedDisableDirectives: "error"` — o comentário vira erro sozinho quando a violação é corrigida, então a allowlist só encolhe. Auditoria: `grep -rn "herança FE-0" src/` |
| `react-hooks/set-state-in-effect`/`no-explicit-any` pré-existentes quebrando o gate do CI | 5 violações em 4 arquivos de produto (regra nova do `eslint-config-next` 16.2.2) — mesmo mecanismo acima, não reescrita de comportamento; `npm run lint` sai 0 erros na FE-0 |
| Detector de design (hook da skill impeccable) reclamando em PRs de move | Moves não alteram UI; se o detector apontar algo num arquivo movido, registrar e corrigir no PR de comportamento seguinte; detector fica fora do CI (decisão FE-0) |

## 14. Decisões em aberto

| Decisão | Recomendação | Quando decidir |
|---|---|---|
| Máquina: à mão vs. XState | Reducer + union discriminada + registry de passos, sem dependência nova | FE-1, no PR da máquina |
| Typegen a partir do OpenAPI | Adotar quando o backend cobrir as ~17 rotas no spec; até lá, espelho manual | Quando W10/backend ampliar o spec |
| `/report/[id]` como Server Component | **Fechada na FE-2 (PR 2c): não adotado.** Decisão prévia do usuário — quebraria o mock de rede do E2E (`mockEngine`, que intercepta `fetch` no cliente) e o Clerk já carrega via `app/layout.tsx` raiz, então não há TTFB a ganhar isolando esta rota. Motivo técnico adicional descoberto na implementação: um Server Component não pode passar `ReportSection[]` (objetos com `Component: ComponentType`, i.e. referências de função) como prop para um Client Component — RSC lança em runtime ("Functions cannot be passed directly to Client Components"), erro que `next build` **não pega** (só análise estática + prerender de rotas estáticas; só apareceu sob Playwright, com o servidor rodando de verdade). Por isso `app/report/[id]/page.tsx` ficou Server Component só para `generateMetadata` + `notFound()`, delegando toda a composição de seções a `public-report-page.tsx` ("use client"), cruzando o boundary só com o `id` (string). | — |
| `features/history` própria vs. dentro de `simulation` | Dentro de `simulation` (é a lista dos mesmos registros); separar só se ganhar comportamento próprio | FE-2, no move |
| Ativação de `GET /law/corpus` (`features/legal-corpus`) | **Fechada na FE-3 (PR 3e): mecanismo pronto, desligado.** `LAW_CORPUS_API_ENABLED` (const `false` em `use-law-corpus.ts`) controla o `enabled:` do `useQuery` — vira `true` numa única linha quando o W1 entregar a rota; o resto (fallback, query key, shape de `LawCorpusResponse`, injeção no `financial-verdict-hero-card`) já está pronto e não muda. | Quando o W1 entregar `GET /law/corpus` |

## 15. Definition of done (por módulo novo)

Um módulo (ex.: `cash-flow`) está pronto quando: vive inteiro em `features/<nome>/`; expõe no máximo um componente de página + hooks; consome dados só pelo seu `api.ts`; declara sua `Capability`; registra suas seções de dossiê; tem teste de componente do fluxo principal; usa tokens e PT-BR; nenhum arquivo > 300 linhas; passa o lint de fronteira sem exceções novas.
