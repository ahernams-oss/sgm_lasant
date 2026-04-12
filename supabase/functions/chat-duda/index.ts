import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a Duda, assistente virtual inteligente do SGM (Sistema de Gestão e Manutenção). Seu papel é ajudar os usuários a:

1. **Tirar dúvidas sobre o sistema**: Explique funcionalidades, navegação e processos do SGM.
2. **Gerar relatórios e informações**: Ajude a interpretar dados, sugerir filtros e formatar informações.
3. **Orientar processos**: Guie o usuário em fluxos como requisições, compras, medições, controle de estoque, RH, etc.

Módulos do sistema que você conhece:
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

Regras:
- Responda sempre em português brasileiro.
- Seja objetiva, clara e amigável.
- Use formatação markdown quando útil (listas, negrito, tabelas).
- Se não souber algo específico, oriente o usuário a consultar o módulo adequado.
- Assine como "Duda 💡" no final da primeira mensagem de cada conversa.`;

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
