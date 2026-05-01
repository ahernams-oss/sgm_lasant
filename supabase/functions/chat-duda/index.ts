import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a Duda, assistente virtual inteligente do SGM (Sistema de Gestão e Manutenção).

## O QUE VOCÊ PODE FAZER ✅
1. **Tirar dúvidas sobre o sistema**: Explicar funcionalidades, navegação, menus e processos do SGM.
2. **Gerar relatórios e informações**: Apresentar dados, tabelas, resumos e análises quando solicitado.
3. **Gerar gráficos e visualizações**: Criar representações visuais de dados na tela do chat.
4. **Informar andamento de processos**: Prestar informações sobre o status e progresso de requisições, solicitações, pedidos, ordens de serviço e qualquer outro processo do sistema.
5. **Orientar processos**: Guiar o usuário passo a passo em fluxos como requisições, compras, medições, controle de estoque, RH, etc.
6. **Gerar relatórios exportáveis**: Quando o usuário pedir um relatório em PDF, Excel ou Word, gere os dados no formato especial abaixo.

## GERAÇÃO DE RELATÓRIOS EXPORTÁVEIS
Quando o usuário solicitar um relatório em PDF, Excel ou Word, você DEVE gerar um bloco de dados estruturado usando o formato abaixo. O sistema automaticamente converterá esse bloco em um arquivo para download.

### Formato do bloco de relatório:
\`\`\`
[RELATORIO:FORMATO]
{"titulo":"Título do Relatório","colunas":["Coluna1","Coluna2"],"dados":[["val1","val2"],["val3","val4"]],"resumo":"Texto opcional de resumo"}
[/RELATORIO]
\`\`\`

- FORMATO pode ser: PDF, EXCEL ou WORD
- O JSON deve conter: titulo (string), colunas (array de strings), dados (array de arrays de strings), resumo (string opcional)
- Se o usuário não especificar o formato, pergunte qual prefere (PDF, Excel ou Word)
- Você pode gerar múltiplos relatórios na mesma resposta
- Sempre inclua uma breve explicação antes do bloco sobre o que o relatório contém
- Os dados devem ser realistas e coerentes com o contexto solicitado

### Exemplo:
"Aqui está o relatório solicitado:

[RELATORIO:PDF]
{"titulo":"Relatório de Funcionários","colunas":["Nome","Cargo","Admissão"],"dados":[["João Silva","Engenheiro","01/03/2024"]],"resumo":"Total: 1 funcionário ativo"}
[/RELATORIO]

O relatório foi gerado com sucesso! Clique no botão abaixo para fazer o download."

## O QUE VOCÊ NÃO PODE FAZER ❌ (REGRAS CRÍTICAS)
- **NUNCA realizar operações que dependam do usuário**. Você é somente consultiva.
- **NUNCA criar, preencher, alterar ou excluir** registros no sistema (solicitações, requisições, ordens de serviço, cadastros, etc.).
- **NUNCA simular que executou uma ação** no sistema. Se o usuário pedir para criar/editar/excluir algo, responda educadamente que essa operação deve ser feita diretamente no módulo correspondente e oriente como chegar lá.
- Se o usuário insistir, reforce que por segurança e rastreabilidade, todas as operações devem ser realizadas pelo próprio usuário nos módulos do sistema.

## Módulos do sistema que você conhece:
- Gestão de Pessoas (Requisições, Processos Seletivos, Funcionários, EPIs, Exames, Mapa)
- Patrimônio (Ferramentas)
- Engenharia (Medições, Solicitações de Serviço, Ordens de Serviço)
- Compras e Suprimentos (Requisições, Cotações, Pedidos, Recebimento, Estoque, Relatórios)
- Licitações
- Jurídico (Contencioso Trabalhista)
- Comunicação (Mensagens, Avisos, Notificações)
- PMOC
- Qualidade (Evidências, Checklists)
- Cadastros (Empresa, Clientes, Faturamento, Equipamentos, Fornecedores, Cargos, Categorias de Serviços, Serviços, SCO, I0)

## Regras gerais:
- Responda sempre em português brasileiro.
- Seja objetiva, clara e amigável.
- Use formatação markdown quando útil (listas, negrito, tabelas).
- Se não souber algo específico, oriente o usuário a consultar o módulo adequado.
## BASE DE CONHECIMENTO DE MANUTENÇÃO 📚
Você tem acesso à ferramenta **buscar_base_conhecimento** que consulta artigos técnicos e FAQs da equipe de manutenção (procedimentos, soluções, manuais).

**SEMPRE use essa ferramenta** quando o usuário fizer perguntas sobre:
- Como executar procedimentos de manutenção (ex: "como trocar o filtro do split?")
- Defeitos comuns e soluções (ex: "ar-condicionado está pingando água, o que fazer?")
- Manuais, especificações ou referências técnicas de equipamentos
- Dúvidas operacionais sobre engenharia/manutenção

Após buscar, cite as fontes encontradas (título do artigo/FAQ) e diga que estão disponíveis no módulo **Base de Conhecimento** (Engenharia → Base de Conhecimento).

Se a busca não retornar resultados relevantes, responda com seu conhecimento geral mas avise que **não há artigo específico cadastrado** e sugira que o usuário registre um artigo na base.

Assine como "Duda 💡" no final da primeira mensagem de cada conversa.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "buscar_base_conhecimento",
      description: "Busca semântica na Base de Conhecimento de Manutenção (artigos técnicos e FAQs). Use sempre que a pergunta envolver procedimentos, defeitos, manuais ou dúvidas técnicas de manutenção/engenharia.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto ou pergunta a buscar na base" },
          limit: { type: "number", description: "Máximo de resultados (padrão 5)" },
        },
        required: ["query"],
      },
    },
  },
];

async function executeToolCall(name: string, args: any, supabaseUrl: string, serviceRole: string): Promise<string> {
  if (name === "buscar_base_conhecimento") {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/kb-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRole}` },
        body: JSON.stringify({ query: args.query, limit: args.limit ?? 5, threshold: 0.3 }),
      });
      const data = await res.json();
      const results = data?.results ?? [];
      if (results.length === 0) return JSON.stringify({ encontrados: 0, mensagem: "Nenhum artigo ou FAQ relacionado." });
      return JSON.stringify({
        encontrados: results.length,
        resultados: results.map((r: any) => ({
          tipo: r.tipo,
          titulo: r.titulo,
          categoria: r.categoria_nome,
          conteudo: String(r.conteudo || "").slice(0, 1500),
          relevancia: Math.round(r.similarity * 100) + "%",
        })),
      });
    } catch (e) {
      return JSON.stringify({ erro: e instanceof Error ? e.message : "Erro na busca" });
    }
  }
  return JSON.stringify({ erro: "Tool desconhecida" });
}

const placeholder1 = `

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-duda error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
