# Tornar a Duda mais inteligente

Você escolheu os 4 eixos de melhoria. Abaixo o plano dividido em fases independentes — podemos executar tudo ou só parte.

---

## Fase 1 — Acesso a dados reais do sistema (maior impacto)

Hoje a Duda **inventa números** nos relatórios porque só recebe o prompt + base de conhecimento. Vamos dar a ela **ferramentas (tools)** que consultam o Supabase em tempo real via Vercel AI SDK.

**Ferramentas que ela ganhará:**
- `consultar_rcs` — RCs por status, solicitante, unidade, período
- `consultar_os` / `consultar_ss` — Ordens e Solicitações de Serviço com filtros
- `consultar_funcionarios` — quadro ativo, admissões, experiência vencendo
- `consultar_estoque` — saldo de materiais, itens críticos
- `consultar_processos_seletivos` — andamento de processos abertos
- `consultar_pedidos_compra` — POs por status e fornecedor
- `consultar_licitacoes` — editais com prazo próximo
- `contar_registros` — totalizadores genéricos por tabela/filtro

Cada tool valida a entrada (Zod), respeita o cliente vinculado ao usuário (mesma regra de RLS que já usamos) e retorna **dados compactos**. A Duda passa a montar relatórios reais a partir disso.

## Fase 2 — Modelo mais potente

Migrar `chat-duda` para o **Vercel AI SDK** com Lovable AI Gateway e usar:
- **Padrão (rápido):** `google/gemini-3-flash-preview` (atual)
- **Modo "Pensar mais":** `openai/gpt-5.2` ou `google/gemini-3.1-pro-preview`

Adicionar um **toggle no chat** ("Resposta rápida" ↔ "Análise aprofundada") para o usuário escolher. Custo só cresce quando o usuário pede.

## Fase 3 — Memória persistente por usuário

- Nova tabela `duda_conversas` (usuario_email, titulo, criado_em)
- Nova tabela `duda_mensagens` (conversa_id, role, parts JSONB, criado_em)
- Sidebar com lista de conversas anteriores + botão "Nova conversa"
- Ao trocar de conversa, recarrega o histórico completo

## Fase 4 — System prompt expandido

Reescrever o prompt com:
- Glossário SGM (RCS, OS, SS, RP, RDO, PMOC, SCO, I0, BDI…)
- Regras de negócio (limites de aprovação, numeração anual NN-YYYY, fluxos)
- Atalhos por módulo ("para aprovar lote de SS, vá em Engenharia → Aprovar SS em Lote")
- Padrão de datas `dd/mm/yyyy, hh:mm`
- Quando usar cada tool

---

## Mudanças técnicas resumidas

- **Edge function `chat-duda`** reescrita com `streamText` + `tools` (AI SDK) substituindo o `fetch` manual atual
- **Novo arquivo** `supabase/functions/_shared/ai-gateway.ts` com o provider helper
- **Novo arquivo** `supabase/functions/chat-duda/tools.ts` com as 8 ferramentas
- **Migração** criando `duda_conversas` e `duda_mensagens` (RLS público, padrão do projeto)
- **`src/pages/ChatDuda.tsx`** migrado para `useChat` do `@ai-sdk/react`, renderizando `message.parts` (texto + chamadas de tool em accordion fechado)
- **Sidebar de conversas** com novo contexto `DudaConversasContext`

---

## Como prefere executar?

Posso fazer tudo de uma vez (mudança grande, ~6-8 arquivos novos/editados) **ou** ir por fases. **Recomendo começar pela Fase 1 + Fase 4** — é o que mais melhora a "inteligência percebida" sem mexer na UI. Memória e modelo potente entram depois.

Me diga: **tudo de uma vez**, **só Fase 1+4 agora**, ou **outra ordem**?
