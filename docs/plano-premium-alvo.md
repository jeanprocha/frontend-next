# Plano PREMIUM — documento-alvo (construir, melhorar, vender)

**Propósito:** alinhar equipa e roadmap à promessa do **plano PREMIUM**: deixar de ser só um “espelho da lei” e tornar-se **agente de optimização de negócios** — consultoria estratégica de elite, apoiada no **RAG**, no **motor determinístico em Go** e em IA onde o ganho é real (classificação, explicação, evidências), sem substituir o número oficial do motor.

**Fontes:** pedido de produto (estrutura estratégica), `.interface-design/system.md`, `docs/sistema-tiers-tribia.md`, `docs/plano-pro-alvo.md`, `.cursor/KNOWLEDGE_BASE.md`.

**Última revisão:** 2026-04-08

---

## 1. Para quem é o PREMIUM e o que prometemos

| Dimensão | Definição |
|----------|-----------|
| **Humano-alvo** | Consultoria de topo, escritórios grandes, CFOs que precisam **justificar investimento em reestruturação**, **defender créditos agressivos** e **entregar ao cliente uma marca própria** — não só um PDF com o logótipo TribIA. |
| **Verbo central** | *Optimizar e antecipar*: contratos, estrutura, risco de glosa e posição vs mercado — sempre com **premissas explícitas** e **motor Go** como fonte de verdade para montantes. |
| **Sensação (interface)** | **Institucional e soberana** — mesmo eixo slate/navy do TribIA; badge de plano em **primary** (navy institucional); **uma** linha narrativa principal por fluxo (evitar empilhar “magia IA” sem hierarquia). White-label na impressão: **confidencialidade** e **marca do cliente**, não carnaval. |

**Promessa comercial (uma frase):**  
*No PREMIUM, o TribIA não só **simula** a reforma — **antecipa risco**, **liga a lei ao contrato e à estrutura**, e **posiciona o cliente no mercado**, com entrega **white-label** e caminho para **parecer jurídico** ao lado do veredito financeiro.*

---

## 2. O que o PREMIUM já “é” no código (baseline)

Capacidades exclusivas (`tribia-plg-flags` / `sistema-tiers-tribia.md`):

| Capacidade | O que desbloqueia na prática |
|------------|------------------------------|
| **`legalOpinionTab`** | Aba **“Parecer jurídico”** no resumo executivo (ao lado do veredito financeiro); rascunho assistido pela IA — pipeline a evoluir, sempre com limites de responsabilidade claros na UI. |
| **`whiteLabelExport`** | **Exportação white-label:** `branding_logo_url` / `branding_org_name` em metadata Clerk; cabeçalho/rodapé de impressão orientados ao cliente; remoção de menções ao motor TribIA quando aplicável; rodapé **confidencial** sem marca TribIA no mesmo tom Free/Pro. |
| **`complianceRadar`** | Faixa no painel da **versão fiscal** (LC 68): copy de **roadmap estratégico** — hoje não substitui dados live de compliance; evolui para monitorização real quando houver backend. |
| **`collectiveIntel`** | Indicador de **inteligência colectiva** no mesmo painel — placeholder de roadmap; alvo natural: **benchmark setorial** (ver proposta 4). |
| **Empresas (Go)** | **`CompanyCreateAllowed`** sempre permitido — **sem teto** de cadastro de empresas (templates vs Free/Pro). |

**Herança do PRO:** Raio-X completo, Board-Ready, histórico rico, comparar A/B, quotas de simulação ilimitadas no limitador — **tudo** o que Pro inclui; Premium acrescenta as flags acima e o sem-teto de empresas.

---

## 3. Salto de valor: do operacional (PRO) ao estratégico (PREMIUM)

| Dimensão | Operacional (PRO) | Estratégico (PREMIUM) |
|----------|-------------------|------------------------|
| **Documentos** | Classifica despesas na tabela; evidências RAG por linha. | **Roadmap:** analisar **contratos** (PDF), cláusulas que bloqueiam créditos / split payment; **minuta de aditivo** sugerida (Contract Auditor). |
| **Análise** | Mostra impacto da lei e cenários A/B no simulador. | **Roadmap:** IA sugere **reestruturação societária** (cisão, domicílio, regimes); mapa de calor **Lucro líquido real** em N estruturas (What-If). |
| **Segurança** | Cita a lei (Raio-X, auditoria RAG). | **Roadmap:** **Risk Score / glosa** por despesa; painel **Defesa antecipada** com argumentos e citações. **Hoje:** `legalOpinionTab` como caminho jurídico explícito ao lado do veredito. |
| **Visão** | Olha para dentro da empresa (histórico, simulação). | **Roadmap:** **benchmark setorial** anónimo; **collectiveIntel** como âncora de produto. |

Esta tabela é o **norte** de produto: linhas marcadas **Roadmap** exigem **ingestão**, **governança de dados**, **premissas** e **testes** — não são só prompts.

---

## 4. Quatro propostas de valor diferenciadas (mapa Fazer / Melhorar / Vender)

### 4.1 Engenharia de contratos assistida por IA (Contract Auditor)

| | Conteúdo |
|---|----------|
| **O quê** | Upload de contratos (PDF); IA identifica cláusulas que impedem créditos CBS/IBS ou que ignoram split payment; gera **minuta de aditivo** com redação sugerida para neutralidade tributária. |
| **Fazer** | Pipeline de ingestão de PDF, chunking jurídico, revisão humana-in-the-loop; templates de aditivo versionados; **nunca** apresentar minuta como “aprovada pelo fisco” sem disclaimer. |
| **Melhorar** | Ligação explícita ao simulador: “benefício calculado **depende** de alinhar contrato ao cenário modelado”. |
| **Vender** | Narrativa PREMIUM: **materializar** o resultado do simulador nos **contratos reais**; redução de risco jurídico. |

**Ligação à interface (`system.md`):** fluxos densos pedem **estados** (upload, parsing, erro, vazio); **um** herói visual por vista; dados sensíveis — linguagem de privacidade e retenção.

---

### 4.2 Simulador de reestruturação societária “What-If”

| | Conteúdo |
|---|----------|
| **O quê** | IA analisa perfil da empresa e sugere cenários (ex.: separar licenciamento de consultoria; domicílio fiscal); **mapa de calor** comparando “Lucro líquido real” em várias estruturas. |
| **Fazer** | Modelo de decisão com **premissas** editáveis; cada estrutura passa pelo **motor Go** (não float no domínio fiscal); visualização comparativa (heatmap) com hierarquia escaneável. |
| **Melhorar** | Integração com histórico e A/B: guardar “pacotes” de estrutura como cenários nomeados. |
| **Vender** | PREMIUM como **planeamento de longo prazo** — justificar investimento em reestruturação. |

**Ligação à interface:** comparar múltiplas estruturas sem virar “dashboard genérico”; **tabular-nums**, rótulo/valor/meta; **squint test** no heatmap.

---

### 4.3 Predição de risco e “Score de glosa”

| | Conteúdo |
|---|----------|
| **O quê** | Por despesa: **Risk Score** 0–100 (probabilidade de questionamento/glosa); painel **Defesa antecipada** com argumentos técnicos e citações à lei. |
| **Fazer** | Classificador com **calibração** e explicabilidade; separar **score** (heurística/IA) de **montante** (Go); defesa antecipada com RAG por artigo. |
| **Melhorar** | `complianceRadar` a evoluir de copy de roadmap para **sinais** reais quando houver regras e dados. |
| **Vender** | PREMIUM: **pensar como o fisco** sem misturar com parecer jurídico definitivo — **Parecer jurídico** continua em `legalOpinionTab` (Premium). |

**Ligação à interface:** scores sem “semáforo festivo”; semântica **emerald** / **âmbar** / **vermelho** com moderação; alinhado a **ConfidenceGauge** existente.

---

### 4.4 Benchmark setorial com IA (inteligência colectiva activa)

| | Conteúdo |
|---|----------|
| **O quê** | Comparação anónima da eficiência tributária com pares do mesmo setor (SaaS, TI, etc.); mensagens tipo: “Empresas do seu setor estão a obter X% mais créditos em nuvem…”. |
| **Fazer** | **Aggregações** com privacidade (k-anonimato, mínimos de amostra); `collectiveIntel` deixa de ser só placeholder quando houver dados. |
| **Melhorar** | Segmentação consistente com classificação de despesas e versão do motor. |
| **Vender** | PREMIUM como **arma competitiva** do consultor — eficiência vs mercado, não só vs lei. |

**Ligação à interface:** `collectiveIntel` no `LegalVersionIndicator` / painel LC — hoje **roadmap**; não prometer dados live até existirem.

---

## 5. Matriz rápida: proposta ↔ flags / código

| Proposta | Flag ou módulo existente | Nota |
|----------|-------------------------|------|
| Parecer / defesa jurídica | `legalOpinionTab` | Já como aba; defesa “glosa” pode alimentar ou distinguir copy. |
| Marca institucional na entrega | `whiteLabelExport` + Clerk | Já implementado no fluxo de impressão. |
| Radar / compliance | `complianceRadar` | Roadmap estratégico na UI; evoluir para dados. |
| Benchmark / mercado | `collectiveIntel` | Alvo natural para benchmark; requer dados agregados. |
| Contract Auditor | — | Novo produto; IA + PDF + governança. |
| What-If societário | — | Novo; depende sempre do motor Go por cenário. |
| Risk Score / glosa | — | Novo; complementa Raio-X sem o substituir. |

---

## 6. Critérios de “PREMIUM pronto para vender” (evolução contínua)

1. **JWT + UI:** tier Premium coerente no Clerk e no backend (`tribia_plan`); white-label testado em `PrintReportHeader` / `PrintReportFooter`.
2. **Honestidade:** IA e scores com **premissas** e **limites**; não confundir rascunho jurídico com parecer profissional.
3. **Hierarquia:** uma narrativa principal por ecrã; **sem** múltiplos heróis visuais (`ResultSidebar` continua o pico permitido no dashboard).
4. **Dados agregados:** benchmark só com política de privacidade e mínimos estatísticos documentados.
5. **Pro:** funcionalidades operacionais continuam claras; **Premium** não “esconde” o Pro — **acrescenta** camadas estratégicas e branding.

---

## 7. Fronteira PRO vs PREMIUM (evitar scope creep)

| Tema | PRO | PREMIUM |
|------|-----|---------|
| Simulação, A/B, histórico rico, Raio-X, Board-Ready | ✓ | ✓ |
| Parecer jurídico (aba dedicada) | — | ✓ |
| Export white-label / confidencial | — | ✓ |
| Radar compliance / inteligência colectiva (painel LC) | — | ✓ (roadmap → dados) |
| Contract Auditor, What-If societário, Risk Score | — | Roadmap PREMIUM |
| Teto de empresas | Configurável | Sem teto |

---

## 8. Manutenção deste documento

- **Quando actualizar:** nova flag PLG, lançamento de roadmap (Contract Auditor, benchmark, etc.), ou alteração em `sistema-tiers-tribia.md`.
- **Alinhar com:** `docs/plano-pro-alvo.md` (PRO) e `.cursor/KNOWLEDGE_BASE.md` secção 5 e índice de documentação.

---

*Documento-alvo do plano PREMIUM: optimização de negócio, branding, inteligência jurídica e de mercado — com motor e RAG como espinha dorsal.*
