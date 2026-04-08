# Plano PRO — documento-alvo (construir, melhorar, vender)

**Propósito:** alinhar equipa e roadmap à promessa de valor do **plano PRO** para consultores e perfis “CFO-adjacentes”: o TribIA como ferramenta de **gestão de risco, decisão e comunicação executiva**, não só uma calculadora.

**Fontes:** `objetivo_pro.md` (raiz do monorepo), `.interface-design/system.md`, `docs/sistema-tiers-tribia.md`, `.cursor/KNOWLEDGE_BASE.md`.

**Última revisão:** 2026-04-08

---

## 1. Para quem é o PRO e o que prometemos

| Dimensão | Definição |
|----------|-----------|
| **Humano-alvo** | Consultor tributário, analista ou fundador que precisa **justificar números**, **comparar cenários** e **apresentar a um conselho** — com credibilidade. |
| **Verbo central** | *Demonstrar*: de onde veio o cálculo, qual o delta entre hipóteses, qual o veredito que o cliente leva para a decisão. |
| **Sensação (interface)** | **Institucional e moderno** — confiança, precisão, escaneabilidade; IA **visível mas contida** (não “caixa-preta” nem carnaval de ícones). Tokens: slate/navy + **emerald** como sinal de “capacidade desbloqueada” no PRO. |

**Promessa comercial (uma frase):**  
*No PRO, o consultor deixa de “correr simulações” e passa a **operar um arquivo de inteligência tributária** — com comparação A/B, Raio-X auditável, histórico rico e entrega Board-Ready sem marca d’água Free.*

---

## 2. O que o PRO já “é” no código (baseline)

Capacidades canónicas (`tribia-plg-flags` / `sistema-tiers-tribia.md`):

| Flag | Significado para o utilizador PRO |
|------|-----------------------------------|
| `rayxFull` | Raio-X **nítido** — realce do trecho do contexto alinhado à classificação; fim do blur de tease do Free. |
| `boardReadyUnlocked` | Modo **apresentação** real (alternância edição/apresentação), tipografia de relatório, impressão sem ramo “Free”. |
| `historyRichPreview` | Histórico como **arquivo activo**: sparklines, tags de economia/carga, Δ, preview rico (desktop), fluxo “comparar dois cenários” → dashboard A/B. |
| `compareAB` | **Comparar cenário** no dashboard e hidratação a partir do histórico. |
| — | **Sem** `freeWatermark`; quotas de simulação diária **ilimitadas** no limitador Go (com enforcement); teto de **empresas** mais alto que no Free (Premium = sem teto). |

**O que o PRO não inclui (fica Premium):** `legalOpinionTab`, `whiteLabelExport`, `complianceRadar`, `collectiveIntel` — ver secção 7.

---

## 3. Mapa: pilares de `objetivo_pro.md` → TribIA PRO

Cada pilar do documento de fundação é ligado ao produto e classificado para **fazer / melhorar / vender**.

### 3.1 Rastreabilidade e fundamentação (“fim da caixa-preta”)

| Necessidade do consultor | Onde vive no TribIA | Fazer | Melhorar | Vender |
|--------------------------|---------------------|-------|----------|--------|
| Vínculo legislativo (LC 68/2024) por crédito/alíquota | RAG por linha, `rag-audit-card`, coluna IA na tabela de créditos, changelog fiscal | Evidências sempre rastreáveis no fluxo PRO | Afinar copy e densidade “CFO-adjacente”; garantir paridade touch (Sheet vs Tooltip) onde for crítico | Narrativa: “cada linha com rasto à lei” na página de pricing e tooltips do histórico |
| Memória de cálculo exportável para auditoria interna | Motor Go + possível export; print Board-Ready | **Export estruturado** (PDF/CSV de passos) se ainda não cobrir o pedido de “fórmula explícita” | Relatório de impressão já “ink-friendly”; acrescentar bloco explícito “passo do motor” onde faltar | Upsell técnico: “pacote de auditoria” no fluxo Board-Ready / impressão |

### 3.2 Modelagem da transição (2026–2033)

| Necessidade | Onde vive | Fazer | Melhorar | Vender |
|-------------|-----------|-------|----------|--------|
| Impacto **ano a ano** | Ano de transição no simulador, gráficos de transição | Cobrir todos os anos relevantes no motor e na UI | Narrativa clara “2027 ≠ 2031” nos cards e no veredito | Destaque na landing PRO: “cronograma de transição” |
| Convivência PIS/COFINS/ISS vs CBS/IBS | Motor, regras versionadas | — | Visualizar **convivência** em resumo (não só número final) se ainda for opaco | Linguagem de “período de overlap” nos briefings |

### 3.3 Inteligência de creditamento

| Necessidade | Onde vive | Fazer | Melhorar | Vender |
|-------------|-----------|-------|----------|--------|
| Classificação de despesas | Pipeline de classificação, chips, confiança | — | Confidence gauges honestos; estados vazio/erro/loading em todo o fluxo PRO | “IA classifica; o motor decide” — sem misturar com parecer jurídico (Premium) |
| Imposto líquido (devido − créditos) | Resultados agregados, tabelas | — | Hierarquia rótulo/valor/meta nos cards (`system.md`) | Veredito financeiro como hero no Board-Ready |

### 3.4 Simulação A/B e what-if

| Necessidade | Onde vive | Fazer | Melhorar | Vender |
|-------------|-----------|-------|----------|--------|
| Comparar hipóteses | `compareAB`, modo comparação no veredito, histórico → dashboard | Fluxos edge (estado vazio, erro ao carregar B) | Delta B vs A sempre legível em impressão e modo apresentação | Copy do `PlgUpgradeDialog` e banners: “decisão com dois cenários lado a lado” |
| Mudança de regime / reestruturação | Regime no formulário, cenários guardados | Cenários nomeados + **templates** por regime (se roadmap) | Atalhos e command palette alinhados a `shortcuts.ts` | Tutoriais curtos: “duplique empresa e mude regime” |

### 3.5 Comunicação Board-Ready

| Necessidade | Onde vive | Fazer | Melhorar | Vender |
|-------------|-----------|-------|----------|--------|
| Fluxo de dinheiro (Sankey, etc.) | Nivo/Recharts no stack | Garantir Sankey/fluxo **coerente** com veredito e print | Um só pico de dramatismo (`ResultSidebar`); resto whisper-quiet | Modo apresentação como CTA principal do PRO no tease Free |
| Relatório que não pareça “print de sistema” | `board-ready`, serif só em apresentação/impressão, `PrintReportChrome` | — | Revisão craft: squint test na hierarquia do PDF | Demonstração em entrevista: 2 min de Board-Ready + impressão |

### 3.6 Rigor numérico e dados

| Necessidade | Onde vive | Fazer | Melhorar | Vender |
|-------------|-----------|-------|----------|--------|
| Precisão monetária | Go + `decimal`; UI com formatadores | Nunca expor regra crítica só no cliente | — | Transparência: “motor em Go, sem float na conta” na documentação |
| Privacidade | Clerk, políticas de produto | Mensagens de retenção/uso **claras** nas settings ou onboarding | — | PRO como “ambiente de trabalho profissional” vs demo Free |

---

## 4. Features PRO “de vitrine” (do `objetivo_pro.md` § comparando com a TribIA)

Estas são as alavancas de **valor visível** acordadas no documento; devem estar sempre polidas antes de campanhas de venda do PRO.

| Feature | Entrega de valor | Notas de interface (`system.md`) |
|---------|------------------|-----------------------------------|
| **Histórico → arquivo de BI** | Sparklines + tags + Δ antes de abrir o registo | Banners semânticos, `role="status"` onde for feedback dinâmico |
| **Comparação A/B** | Executive briefing com delta explícito | Veredito `mode: "comparison"` sobe no print (`print:order-first`) |
| **Raio-X full** | Evidência no texto + base legal legível no Pro | Callout `#ray-x-anchor-callout`; sem blur no realce |
| **Board-Ready** | Serif só com `board-ready:*`; selos institucionais no print | Glow do pipeline suprimido em Board-Ready; sem misturar serif no canvas operacional |
| **Orquestração** | Pipeline + ambient glow + gauges de confiança | `prefers-reduced-motion`: estado estático por estágio; não competir com o `ResultSidebar` |

---

## 5. Critérios de “PRO pronto para vender”

Checklist objetiva (produto + UX):

1. **Free → Pro:** utilizador entende em **um ecrã** o que desbloqueia (comparar, histórico rico, Raio-X, Board-Ready, sem quota diária) sem jargon só técnico.
2. **JWT + UI:** tier Pro no Clerk reflete-se no backend (`tribia_plan`); sem divergência “vejo Pro mas API trata Free”.
3. **Impressão:** ramo Pro no rodapé sem “Free”; hierarquia legível no papel (`@media print` em `globals.css`).
4. **Acessibilidade:** estágios do pipeline anunciados (`aria-live`); foco visível em controlos críticos.
5. **Honestidade da IA:** confiança baixa = aviso visível; alinhado à regra “IA explica; Go calcula”.

---

## 6. Backlog sugerido (prioridade relativa)

Ordem indicativa; ajustar a métricas de negócio.

1. **Endurecer** fluxos PRO já existentes (A/B do histórico, estados de erro, cache por `plgTier`).
2. **Memória de cálculo / export auditável** — fechar gap explícito do pilar 3.1 se ainda não satisfizer consultores.
3. **Narrativa ano-a-ano e convivência** nos resumos (copy + visualizações onde o motor já suporta).
4. **Pack de demonstração** (Loom/script) centrado em Board-Ready + histórico + A/B — “vender” dentro e fora da plataforma.

---

## 7. Fronteira PRO vs Premium (evitar scope creep)

| Tema | PRO | Premium |
|------|-----|---------|
| Veredito financeiro + Board-Ready + impressão TribIA | ✓ | ✓ |
| Parecer jurídico dedicado | — | `legalOpinionTab` |
| Marca do cliente na exportação | — | `whiteLabelExport` + metadata Clerk |
| Faixas Compliance Radar / Inteligência colectiva no painel LC | — | ✓ |
| Limite de empresas | Teto alto (configurável) | Sem teto |

Qualquer item novo que pareça “escritório grande / marca própria / jurídico” deve ir para **Premium**, não diluir o escopo do PRO.

---

## 8. Manutenção deste documento

- **Quando actualizar:** mudança de capacidade PLG, novo pilar em `objetivo_pro.md`, ou conclusão de épica que feche um “Fazer” deste mapa.
- **Gatilho:** alinhar com `.cursor/KNOWLEDGE_BASE.md` secção 5 e `docs/sistema-tiers-tribia.md`.

---

*Documento-alvo do plano PRO: o que construímos, refinamos e como posicionamos na plataforma.*
