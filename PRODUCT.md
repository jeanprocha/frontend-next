# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primário (confirmado na entrevista):** consultor tributário / contador que roda diagnósticos da reforma para os seus clientes e entrega o dossiê como parecer. A direção do produto é B2B2B — carteira de CNPJs por escritório (roadmap W9).

**Secundários:**

- O cliente do consultor (empresário, CFO) — lê o dossiê público `/report/[id]` sem login; é a audiência da narrativa, do veredito e do modo Board-Ready.
- Avaliadores técnicos do portfólio — recrutadores e pares que julgam engenharia, produto e design pela demo (ver Propósito).

## Product Purpose

Plataforma de diagnóstico da reforma tributária brasileira (CBS/IBS, transição 2026–2033). O consultor sobe despesas (CSV ou formulário); a IA classifica cada despesa quanto ao direito a crédito citando o artigo da lei (RAG com evidência auditável); o motor Go calcula carga atual × projetada e a série 2026–2033; o resultado vira um dossiê público compartilhável, com o override humano do consultor preservado como trilha de divergência.

**Sucesso hoje (confirmado na entrevista):** o TribIA é uma peça de portfólio / demo técnica. Sucesso = impressionar quem avalia, não adoção paga. Decisões de design devem maximizar a qualidade percebida da demo sem fechar portas para comercialização futura.

## Positioning

"De simulador para plataforma de diagnóstico e defesa da transição 2026–2033" (plano de evolução, 26/08/2026). O cálculo virou commodity — calculadora oficial da RFB, simuladores gratuitos de Sebrae/IOB/Contabilizei; o valor está na **decisão defensável**. Dois ativos que um vizinho gratuito não copia honestamente:

1. **Classificação de crédito com citação auditável da lei** — RAG com evidência reconstruída dos metadados do chunk (artigo, parágrafo, inciso, âncora no PDF oficial), human-in-the-loop.
2. **Motor de cálculo determinístico e reproduzível** — exatamente a ferramenta exigida pela apuração assistida (contestar o cálculo do Fisco exige refazer a conta).

Mantra do produto: **"IA explica; Go calcula."** A LLM nunca substitui a matemática.

## Operating Context

- Fluxo do consultor: CSV/formulário → classificação em lote (LLM + RAG) → simulação (motor Go) → snapshot persistido → override do consultor → recálculo sem novo batch de IA → dossiê `/report/[id]` público, apresentado ou enviado ao cliente.
- O dossiê é lido fora da ferramenta (tela do cliente, impressão, reunião de board) — o modo Board-Ready existe para essa cena.
- Corpus normativo: hoje single-doc, nomeado "LC 68/2024" (nome do PLP pré-sanção). O roadmap W1 migra para LC 214/2025 + atos de 2026; até lá, a UI não deve exibir selos de atualização normativa que o backend não sustenta.
- Roadmap por workstreams em `../docs/plano-evolucao-tribia.md` (W1–W10); alvo de refactor do frontend em `docs/arquitetura-frontend.md`.

## Capabilities and Constraints

- Pipeline completo funciona ponta a ponta (classificação → simulação → registro → dossiê); modelo dual comparativo por ano (sistema legado × sistema de destino, duas simulações independentes).
- Quotas por plano free/pro (PLG) com diálogo de upgrade no frontend; **preço comercial real: indefinido** — não inventar valores.
- Auth Clerk nas rotas de trabalho; rotas de dossiê públicas por design.
- Convenção de delta: positivo = custo adicional; negativo = economia. Dinheiro trafega como string no JSON; toda regra fiscal vive no motor Go, nunca na UI.
- **Indefinido:** ordem de execução dos workstreams além dos P0 do plano.

## Brand Commitments

- Nome: **TribIA**. Idioma: **PT-BR** em toda a UI (resíduo PT-PT é defeito a corrigir, não estilo).
- Voz: autoridade institucional-técnica — o produto fala como parecer, não como peça de marketing.
- Direção visual incumbente ("Institucional Moderno": navy/slate + acento esmeralda único; Geist, Geist Mono, Source Serif 4) registrada em `.interface-design/system.md` — a autoridade visual vive lá, não neste arquivo.

## Evidence on Hand

- PDF oficial da lei em `public/legislacao/DOC-PLP-682024-20240722.pdf` — as âncoras de citação apontam para ele.
- CSV de exemplo em `public/despesas.csv`.
- **Ausências que trabalho futuro não pode fabricar:** não há clientes reais, depoimentos, casos de sucesso, benchmarks, selos de validação (o selo RFB do W7 ainda não existe) nem preço público.

## Product Principles

1. **IA explica; Go calcula** — narrativa nunca substitui o cálculo determinístico; cada número é reproduzível.
2. **Tudo auditável** — toda afirmação da UI aponta para lei citada, cálculo aberto ou registro de quem decidiu (IA × consultor).
3. **A estimativa vira parecer** — o entregável é um documento defensável perante terceiros, não um número num dashboard.
4. **Demo impecável sem fabricação** — polir para impressionar avaliadores, jamais inventar evidência (clientes, selos, números).
5. **O consultor assina** — human-in-the-loop é posição de produto: a ferramenta prepara, o profissional responde pelo parecer.
