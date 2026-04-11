# TribIA — Interface design system

Documentação viva das decisões já presentes no código. Atualizar quando novos padrões se repetirem (2+ telas ou componentes).

---

## Direção e sensação

**Nome interno:** Institucional Moderno.

- **Quem usa:** analista fiscal, founder de SaaS ou contador revisando cenário CBS/IBS — precisa de **autoridade** (lei, números) e **clareza operacional** (pipeline, próximo passo).
- **O que deve transmitir:** confiança institucional (navy/slate) + **acento financeiro** único (esmeralda) para progresso, sucesso e destaque de impacto.
- **O que evitar:** “dashboard genérico” sem âncora de domínio; múltiplos halos coloridos competindo na mesma dobra.

---

## Tipografia e escala

| Decisão | Implementação |
|--------|----------------|
| Sans principal | Geist (`--font-geist-sans`) |
| Dados / alinhamento | Geist Mono (`--font-geist-mono`), `tabular-nums` onde há valores comparáveis |
| Narrativa / impressão | Source Serif 4 — classe `.font-board-report` (modo Board-Ready) |
| Escala global | `html { font-size: 110% }` em `globals.css` — **todos** os `rem` e utilitários Tailwind seguem essa base |

Novos componentes não devem “corrigir” tamanho com `text-[13px]` salvo exceção documentada.

---

## Profundidade (estratégia única)

**Regra:** separação de áreas com **bordas legíveis no squint test** (sem harsh lines) + **sombras muito suaves** em cartões de trabalho; **um único momento “premium”** por dobra (veredito Hero, sidebar de resultado) com **um degrau a mais** que o resto.

### Escala de elevação (Cockpit de autoridade)

| Nível | Superfície | Borda / sombra | Onde |
|-------|------------|----------------|------|
| **Canvas** | `--tribia-canvas` (afundado vs. `--card`) | — | `<main>` do dashboard (`bg-tribia-canvas`) |
| **Trabalho** | `bg-card` | `border-border/80` + sombra `0_8px_30px` leve | Esteira, `SummaryCards`, blocos técnicos na tab Go |
| **Veredito Hero** | `.tribia-surface-verdict` | `border-emerald-500/30`, `ring-1 ring-border/45`, `shadow-lg` | `ComparisonVerdictCard` (Sessão 1 / comparação A/B) |

**Utilitários** (`globals.css`): `.tribia-surface-work` (cartão de trabalho padrão), `.tribia-surface-verdict` (ancorador da página — acima do work).

- **Padrão (formulários, hubs, esteira):** preferir `.tribia-surface-work` ou equivalente `border-border/80` + `bg-card` + sombra documentada.
- **Exceção (sidebar de resultado):** `shadow-2xl` + halo esmeralda atrás — continua reservado à sidebar; não replicar em cada card.

**Anti-padrão:** misturar halos animados + gradiente forte + sombra pesada em **vários** blocos na mesma viewport — ver ajuste “squint” em `globals.css` (opacidade do pipeline glow).

### Cinco pilares do território visual (produto)

1. **Autoridade fiscal** — tipografia serif (`.font-board-report`) em trechos legais / board-ready.  
2. **Rastro auditável** — esteira de quatro passos (jornada numerada).  
3. **Determinismo (Go)** — tab Motor Go: `font-mono`, precisão decimal, sem “opinião” no lugar do cálculo.  
4. **Interpretação (IA)** — tab Classificação: diagnósticos por linha, custo morto ilustrativo.  
5. **Convivência temporal** — timeline e série 2026–2033 na rampa de transição.

---

## Tokens semânticos (TribIA)

Definidos em `src/app/globals.css` e expostos ao Tailwind via `@theme inline`.

| Token | Uso |
|-------|-----|
| `tribia-canvas` | Fundo da área principal do simulador (`<main>` do dashboard), abaixo do header — separa levemente do `background` do shell |
| `tribia-navy-hero` | Painéis **sempre escuros** (ex.: faixa superior da sidebar de resultado), independentemente de `:root` / `.dark` |
| `background`, `foreground`, `card`, `border`, `muted`, `accent`, `primary`, `chart-*` | Design system base (shadcn + OKLCH) |

### Migração: `slate-*` / `emerald-*` literais

Preferir tokens antes de classes Tailwind arbitrárias:

| Padrão antigo (frequente) | Direção |
|---------------------------|---------|
| `border-slate-200/60`, `dark:border-slate-700/60` | `border-border/80` (trabalho) ou `border-border` |
| `bg-slate-50/50` no canvas do dashboard | `bg-tribia-canvas` |
| Cabeçalho escuro fixo “marca TribIA” | `bg-tribia-navy-hero` (não `bg-primary` no dark — primary inverte) |
| Destaque de foco em hub | `border-accent/*` ou `ring-accent` |
| Gráficos / série “projetado” | `chart-1` … `chart-5` ou `accent` |

**Arquivos com muitas ocorrências de slate/emerald** (migração gradual): `result-sidebar.tsx`, `summary-cards.tsx`, `comparison-verdict-card.tsx`, `simulation-form.tsx`, `regime-follow-ups.tsx`, `rag-audit-card.tsx`, `scenario-comparison-bar.tsx`.

---

## Padrões de produto

### Pipeline glow (`dashboard-pipeline-glow`)

- Camada fixa atrás do conteúdo; posição `--tribia-glow-x` / `--tribia-glow-y` via JS no dashboard.
- Opacidade e tamanho do elipse por `main[data-pipeline-stage]` (context → … → verdict).
- Pulse só no estágio `simulation` (`dashboard-pipeline-glow--pulse`).
- Desliga no modo Board-Ready e na impressão.

### Sidebar de resultado

- Halo esmeralda **atrás** do card (blur), conteúdo em `z-10`.
- Card: borda suave + vidro; faixa superior `tribia-navy-hero` + ruído SVG leve.

### Context hub

- Card com borda tokenizada, foco com acento institucional (`accent`).
- Callouts Rayx: estados `pro` / `free` / `missing` com cores semânticas (esmeralda / neutro / âmbar).

### Board-Ready

- Variante `@variant board-ready`, tipografia serif, glow de pipeline suprimido, utilitários `no-print` / `print-page-break`.

### Touch / apresentação

- `tribia-touch-target` — alvo mínimo ~44px em pointer coarse.
- `tribia-row-actions-always-visible` em tablet — ações de linha sem depender de hover.

---

## Acessibilidade

- `prefers-reduced-motion`: transições do pipeline glow desligadas; animações de pulse respeitadas.
- Navegação: `aria-label`, `aria-current`, breadcrumbs onde aplicável.
- Ícones decorativos: `aria-hidden` + texto visível ou `sr-only` quando necessário.

---

## Como auditar

1. Novo card: usa `border-border` ou `tribia-*` em vez de `slate-*` para estrutura?
2. Novo bloco com sombra: é o “momento premium” da tela ou só mais um?
3. Contraste de texto: quatro níveis (`foreground` → `muted-foreground`) antes de inventar cinza novo?

---

## Changelog interno

| Data | Nota |
|------|------|
| 2026-04 | Criação: tokens `tribia-canvas`, `tribia-navy-hero`; redução fina do pipeline glow e do halo da sidebar (squint pass). |
| 2026-04-09 | Cockpit de autoridade: `--tribia-canvas` e `--border` afinados (light/dark); utilitários `tribia-surface-work` / `tribia-surface-verdict`; esteira e SummaryCards com silhueta `border-border/80`. |
