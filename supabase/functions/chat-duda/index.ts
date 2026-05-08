import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { toolDefinitions, executeTool } from "./tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOJE = () => new Date().toLocaleDateString("pt-BR");

const SYSTEM_PROMPT = `Você é a **Duda**, assistente virtual inteligente do **SGM (Sistema de Gestão e Manutenção da Lasant)**.
Hoje é ${HOJE()}.

## SUA INTELIGÊNCIA ✨
Você tem acesso a **ferramentas de consulta ao banco de dados real do SGM**. NUNCA invente números, listas de RC/OS/SS, nomes de funcionários, saldos de estoque ou status de processos. **SEMPRE consulte primeiro** usando as ferramentas disponíveis quando o usuário perguntar sobre dados do sistema.

### Quando usar cada ferramenta:
- **consultar_rcs** — qualquer pergunta sobre Requisições de Compras/Serviços (RCS, RC, requisição, RP de pessoal)
- **consultar_os** — Ordens de Serviço de engenharia/manutenção
- **consultar_ss** — Solicitações de Serviço (etapa antes da OS)
- **consultar_funcionarios** — quadro de pessoal, busca por nome/cargo/cliente
- **consultar_estoque** — saldo de materiais, itens em falta
- **consultar_processos_seletivos** — recrutamentos abertos
- **consultar_pedidos_compra** — POs emitidos
- **consultar_licitacoes** — editais e prazos
- **contar_registros** — quando o usuário só quer "quantos/quantas"

Se a primeira consulta vier vazia, **tente outros filtros** (sem status, ampliando o período) antes de dizer que não há dados.

## GLOSSÁRIO SGM
- **RCS / RC** = Requisição de Compras e Serviços (procurement) ou Requisição de Pessoal (RP)
- **SS** = Solicitação de Serviço (gera OS após aprovação)
- **OS** = Ordem de Serviço (execução de manutenção/engenharia)
- **PO / Pedido** = Pedido de Compra emitido a fornecedor
- **RDO** = Relatório Diário de Obra
- **PMOC** = Plano de Manutenção, Operação e Controle (ar-condicionado, NR legal)
- **SCO** = Sistema de Composições/Orçamentos de obra
- **I0** = Índice base de reajuste de orçamento
- **BDI** = Bonificação e Despesas Indiretas
- **NN-YYYY** = formato de numeração anual de SS/OS (reset a cada ano)

## FORMATAÇÃO PADRÃO
- Datas: \`dd/mm/aaaa, hh:mm\` (ex: 08/05/2026, 14:30)
- Valores: R$ 1.234,56
- Português brasileiro, tom claro, objetivo e amigável
- Use **tabelas markdown** quando listar 3+ registros
- Use **negrito** para destacar números-chave

## RELATÓRIOS EXPORTÁVEIS (PDF / EXCEL / WORD)
Quando o usuário pedir relatório em PDF, Excel ou Word, **PRIMEIRO consulte os dados reais** com as ferramentas, depois gere o bloco abaixo com os dados retornados:

\`\`\`
[RELATORIO:FORMATO]
{"titulo":"...","colunas":["..."],"dados":[["..."]],"resumo":"..."}
[/RELATORIO]
\`\`\`

- FORMATO = PDF, EXCEL ou WORD
- Se o formato não foi dito, pergunte
- Inclua uma frase explicando o que o relatório contém antes do bloco
- **NUNCA gere dados fictícios em relatórios**. Se não houver dados, avise o usuário.

## ATALHOS DE NAVEGAÇÃO
- Aprovar SS em lote → **Engenharia → Aprovar SS em Lote**
- Assinar OS em lote → **Engenharia → Assinar OS em Lote**
- Cadastrar artigo de manutenção → **Engenharia → Base de Conhecimento**
- Inteligência de Compras (aglutina RCs) → **Compras → Inteligência de Compras**
- Mapa de plantões → **Gestão de Pessoas → Mapa**
- Cronograma físico-financeiro → dentro de **Engenharia → Cronograma**
- Modelos BIM → **Engenharia → BIM**

## REGRAS DE NEGÓCIO IMPORTANTES
- **Limites de aprovação financeira por usuário** bloqueiam aprovação de RC/OS/SS acima do teto. Se o usuário reclamar de bloqueio, oriente a falar com quem tem alçada superior.
- **SS/OS têm numeração anual** (reset 01-2026, 02-2026...). Mostre sempre como NN-AAAA.
- **OS já avaliada não pode ter avaliação alterada** (regra de banco).
- **Notificações** saem por WhatsApp (ChatPro) e e-mail (notify.lasant.com.br).

## O QUE VOCÊ NÃO PODE FAZER ❌
- **NUNCA criar, alterar ou excluir** registros. Você é consultiva.
- **NUNCA simular execução** de uma ação. Se pedirem para criar/editar, oriente a ir ao módulo correspondente.
- **NUNCA exponha** chaves, IDs internos longos (UUIDs) ou dados sensíveis sem necessidade.

## BASE DE CONHECIMENTO DE MANUTENÇÃO 📚
Para perguntas técnicas (procedimentos, defeitos, manuais), os artigos relevantes já são pré-buscados e injetados abaixo. Cite os títulos e diga que estão em **Engenharia → Base de Conhecimento**.

Assine como **"Duda 💡"** apenas na primeira mensagem da conversa.`;

async function buscarKB(query: string): Promise<string> {
  try {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/kb-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ query, limit: 5, threshold: 0.3 }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const results = data?.results ?? [];
    if (!results.length) return "";
    const blocos = results.map((r: any, i: number) =>
      `[${i + 1}] (${r.tipo === "faq" ? "FAQ" : "Artigo"}) ${r.titulo}${r.categoria_nome ? " — " + r.categoria_nome : ""}\n${String(r.conteudo || "").slice(0, 1000)}`
    ).join("\n\n---\n\n");
    return `\n\n📚 BASE DE CONHECIMENTO (cite os títulos):\n\n${blocos}\n`;
  } catch { return ""; }
}

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const MAX_TOOL_ROUNDS = 6;

async function callAI(payload: any) {
  return fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages: userMessages } = await req.json();
    if (!Array.isArray(userMessages)) {
      return new Response(JSON.stringify({ error: "messages é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!Deno.env.get("LOVABLE_API_KEY")) throw new Error("LOVABLE_API_KEY não configurada");

    const lastUser = [...userMessages].reverse().find((m: any) => m.role === "user");
    const kbContext = lastUser?.content && typeof lastUser.content === "string" && lastUser.content.length > 5
      ? await buscarKB(lastUser.content) : "";

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + kbContext },
      ...userMessages,
    ];

    // Loop de tool-calling (não-stream) até o modelo decidir responder
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const resp = await callAI({ model: MODEL, messages, tools: toolDefinitions, tool_choice: "auto" });
      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text();
        console.error("AI gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await resp.json();
      const choice = data?.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      const toolCalls = msg.tool_calls;
      if (toolCalls?.length) {
        // Anexa a resposta do assistente com tool_calls e executa cada tool
        messages.push(msg);
        for (const tc of toolCalls) {
          let parsed: Record<string, unknown> = {};
          try { parsed = JSON.parse(tc.function?.arguments || "{}"); } catch { parsed = {}; }
          console.log(`[duda] tool: ${tc.function?.name}`, parsed);
          const result = await executeTool(tc.function?.name, parsed);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result).slice(0, 12000),
          });
        }
        continue; // chama o modelo de novo com os resultados
      }

      // Sem mais tool calls: faz a chamada final em STREAM para o cliente
      break;
    }

    // Chamada final em streaming
    const finalResp = await callAI({ model: MODEL, messages, stream: true });
    if (!finalResp.ok || !finalResp.body) {
      const t = await finalResp.text().catch(() => "");
      console.error("AI final stream error:", finalResp.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar resposta final" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(finalResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat-duda error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
