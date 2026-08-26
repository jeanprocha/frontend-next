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

**Nota sobre `lib/`:** a lógica específica de feature migra **junto com a feature** (ex.: `transition-*` → `features/simulation/lib/`, `rag-*` e `classification-*` → `features/classification/lib/`, `history-hydrate` → `features/simulation`), levando os testes. O `lib/` final é pequeno e estável.

## 4. Camada de dados

- Quebrar `lib/api.ts` (432 linhas) em **clients por domínio** (`features/*/api.ts`) sobre um núcleo comum (`lib/http.ts`): fetch, auth headers, `ApiError`/`request_id`, conversão de erro PLG → capability. Nada disso muda de comportamento — muda de lugar.
- **Query keys convencionadas:** `[domínio, entidade, id?, params?]` (ex.: `['simulation-records', 'detail', id]`), invalidação por prefixo de domínio.
- **Contrato:** manter `types/` espelhando os DTOs por ora; quando o backend ampliar o `openapi.yaml` (hoje cobre 2 de ~17 rotas), avaliar geração de tipos a partir do spec — o espelho manual é o maior risco silencioso de drift (decisão em aberto, seção 14).
- Valores monetários seguem trafegando como **string decimal** — nenhuma feature converte para `number` fora de `lib/` (decimal.js).

## 5. O pipeline como máquina de estados

Extrair de `dashboard/page.tsx` + `use-simulation.ts` + `simulation-recalc-bridge.tsx` uma máquina única em `features/simulation/machine/`:

```
idle → importing → classifying → calculating → enriching → saved
                        ↑______________ recalc (override) ______↓
```

- Etapas são **passos registrados** (cada um: `run(input, ctx)`, estado de progresso, erro próprio). Novos passos entram sem tocar nos existentes — ex.: `validating-rfb` (W7), `parsing-xml` (W8).
- O recálculo debounced do override vira uma **transição** da mesma máquina (o bridge morre).
- A página consome um hook único: estado atual, progresso por etapa, resultado, ações. Todo `useState` de orquestração sai da rota; o que hoje vive no `useTaxStore` e é estado de pipeline (não de UI) migra para a máquina.
- A máquina é lógica pura + efeitos isolados → testável com vitest sem browser.
- **Implementação (recomendação):** reducer com union discriminada + registry de passos, à mão — sem XState. O grafo é linear com um ciclo; uma dependência nova não paga o próprio custo aqui (formalizada na seção 14).

## 6. Report engine (dossiê como composição)

```ts
type ReportSection = {
  id: string
  title: string
  capability?: Capability        // gating PLG declarativo
  Component: FC<{ record: SimulationRecord }>
  print?: 'always' | 'board-only' | 'never'
}
```

- O dossiê (`/report/[id]` e a visão logada) itera um **registry de seções**; board-ready e impressão viram *modos de render*, não componentes paralelos.
- Fases novas adicionam seções sem tocar no shell do dossiê: memória de cálculo (W2), impacto no caixa (W3), plano de ação (W4), fornecedores (W5), selo de validação RFB (W7), data-base do corpus (W1).
- Registros antigos continuam abrindo: o registry recebe o record já enriquecido pelo backend (`enrichTransitionSeriesLegacy`); seção sem dados no snapshot não renderiza — nunca quebra.

## 7. Importers plugáveis

```ts
type Importer = {
  id: 'form' | 'csv' | 'xml-nfe' | 'sped'
  accepts?: string[]             // extensões/mime
  parse(input: File[] | FormData): Promise<SimulationInput>
}
```

- O CSV atual (papaparse + detecção de colunas) refatora para esse contrato; o formulário manual também é um importer (normaliza tudo para `SimulationInput`).
- XML NF-e (W8) entra como novo importer que produz o mesmo `SimulationInput` enriquecido (NCM, CFOP, CNPJ do fornecedor) — o pipeline não muda.

## 8. Entitlements (PLG)

- `features/plg/` vira a única fonte: plano (Clerk metadata) → `capabilities` → consumo declarativo:
  - `<RequireCapability cap="cashFlow" fallback={<UpgradeCard/>}>…</RequireCapability>`
  - `useCapability('compareAB')` para lógica.
- Migram para cá: os ~13 flags de `tribia-plg-flags.ts`, `components/tribia/` (meter, dialog, badge, provider) e os hooks `use-plg-quota`/`use-tribia-plg-tier`.
- Erros 403-com-código do backend continuam virando diálogo de upgrade, mas num único interceptor do client HTTP (`lib/http.ts`).

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

### FE-2 — Modularização por domínio

| Entrega | Detalhe |
|---|---|
| `features/` populado | moves por domínio na ordem `classification` → `report` → `simulation`; a `lib/` específica migra junto com os testes (nota da seção 3) |
| `features/plg` | `RequireCapability` + `useCapability`; flags, `components/tribia` e hooks de plano migram; `if`s espalhados morrem |
| Registry de seções do dossiê | board-ready e print viram modos de render (seção 6) |

**Gate:** `components/tax/` vazio (contagem = 0); dossiê renderiza 100% via registry; nenhum `if` de plano fora de `features/plg`.
**Depende de:** FE-1. **Destrava:** W2 e W4 do plano de evolução (memória de cálculo e plano de ação entram como seções).

### FE-3 — Extensibilidade: as portas dos módulos novos

| Entrega | Detalhe |
|---|---|
| Contrato `Importer` | CSV e formulário migram (seção 7); registry em `features/import` |
| Passos de pipeline plugáveis | `validating-rfb` (W7) e `parsing-xml` (W8) podem entrar sem tocar na máquina |
| `features/legal-corpus` | consome `GET /law/corpus` quando W1 entregar; `FISCAL_LAW_CHANGELOG` hardcoded morre |

**Gate (prova mecânica):** adicionar uma seção de dossiê fake + um importer fake exige tocar **só** os registries — nenhum diff em shell, máquina ou página.
**Depende de:** FE-2; a entrega do corpus depende do W1 (backend) — as outras duas não. **Destrava:** Fases 1–3 do plano de evolução (W3, W5, W6, W8-XML entram como `features/` novas seguindo a seção 13 de DoD).

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
| `/report/[id]` como Server Component | Avaliar: página pública, dados via GET público, ganho real de TTFB/print; exige conferir RSC no Next 16 | FE-2, ao migrar o report |
| `features/history` própria vs. dentro de `simulation` | Dentro de `simulation` (é a lista dos mesmos registros); separar só se ganhar comportamento próprio | FE-2, no move |

## 15. Definition of done (por módulo novo)

Um módulo (ex.: `cash-flow`) está pronto quando: vive inteiro em `features/<nome>/`; expõe no máximo um componente de página + hooks; consome dados só pelo seu `api.ts`; declara sua `Capability`; registra suas seções de dossiê; tem teste de componente do fluxo principal; usa tokens e PT-BR; nenhum arquivo > 300 linhas; passa o lint de fronteira sem exceções novas.
