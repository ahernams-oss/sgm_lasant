// Ferramentas que a Duda pode chamar para consultar dados reais do SGM.
// Usadas pela edge function chat-duda via tool-calling OpenAI-compatible.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

// Definições no formato OpenAI tools
export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "consultar_rcs",
      description: "Consulta Requisições de Compras e Serviços (RCS) reais do banco. Use SEMPRE que o usuário pedir status, listagem, contagem ou relatório de RC/RCS/requisições de compras.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtra por status (ex: 'Enviada', 'Aprovada', 'Rejeitada', 'Concluída')" },
          solicitante: { type: "string", description: "Filtra por nome do solicitante (busca parcial)" },
          centro_custo: { type: "string", description: "Filtra por centro de custo / unidade (busca parcial no nome)" },
          urgencia: { type: "string", description: "Filtra por urgência (Normal, Urgente, etc)" },
          dias_recentes: { type: "number", description: "Limitar aos últimos N dias", default: 30 },
          limite: { type: "number", description: "Quantidade máxima de registros (padrão 50, máx 200)", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_os",
      description: "Consulta Ordens de Serviço (OS) de engenharia/manutenção reais. Use para status, listagem ou contagem de OS.",
      parameters: {
        type: "object",
        properties: {
          situacao: { type: "string", description: "Ex: 'Aberta', 'Em Execução', 'Concluída', 'Cancelada'" },
          cliente_nome: { type: "string", description: "Filtra por nome do cliente (busca parcial)" },
          prioridade: { type: "string", description: "Ex: 'A: EMERGENCIAL', 'B: URGENTE', 'C: PROGRAMADA'" },
          dias_recentes: { type: "number", description: "Últimos N dias", default: 60 },
          limite: { type: "number", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_ss",
      description: "Consulta Solicitações de Serviço (SS) reais. Use para listar SS abertas, aguardando aprovação, etc.",
      parameters: {
        type: "object",
        properties: {
          situacao: { type: "string", description: "Ex: 'Aguardando aprovação', 'Aprovada', 'Rejeitada', 'OS Gerada'" },
          cliente_nome: { type: "string" },
          prioridade: { type: "string" },
          dias_recentes: { type: "number", default: 60 },
          limite: { type: "number", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_funcionarios",
      description: "Consulta funcionários cadastrados (quadro). Use para listar, contar por cargo/cliente, ou achar funcionários específicos.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Busca parcial por nome" },
          cargo: { type: "string", description: "Filtra por cargo (busca parcial)" },
          cliente_nome: { type: "string", description: "Filtra por cliente vinculado" },
          situacao: { type: "string", description: "Ex: 'Ativo', 'Demitido', 'Em experiência'" },
          limite: { type: "number", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_estoque",
      description: "Consulta o estoque calculado a partir das movimentações. Retorna saldos por material. Use para 'quanto tem de X', 'itens em falta', 'top materiais'.",
      parameters: {
        type: "object",
        properties: {
          material_nome: { type: "string", description: "Filtra por nome do material (busca parcial)" },
          apenas_zerados: { type: "boolean", description: "Mostrar apenas materiais com saldo <= 0", default: false },
          limite: { type: "number", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_processos_seletivos",
      description: "Consulta processos seletivos abertos/em andamento (oriundos de RCs de pessoal).",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Ex: 'Em Andamento', 'Concluído', 'Cancelado'" },
          cargo: { type: "string", description: "Filtra por cargo solicitado" },
          limite: { type: "number", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_pedidos_compra",
      description: "Consulta Pedidos de Compra (POs) emitidos para fornecedores.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Ex: 'Emitido', 'Confirmado', 'Recebido', 'Cancelado'" },
          fornecedor_nome: { type: "string" },
          dias_recentes: { type: "number", default: 60 },
          limite: { type: "number", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_licitacoes",
      description: "Consulta licitações cadastradas, com prazos e status. Útil para 'editais com prazo próximo'.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Ex: 'Em Análise', 'Participando', 'Vencida', 'Perdida'" },
          dias_ate_abertura: { type: "number", description: "Apenas com abertura nos próximos N dias" },
          limite: { type: "number", default: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "contar_registros",
      description: "Conta registros em uma tabela com filtros simples por status. Use quando o usuário só quer 'quantas/quantos'.",
      parameters: {
        type: "object",
        properties: {
          tabela: {
            type: "string",
            enum: [
              "requisicoes_compras", "ordens_servico", "solicitacoes_servicos",
              "funcionarios", "pedidos_compra", "cotacoes_compras",
              "processos_seletivos", "licitacoes", "clientes", "fabricantes",
              "materiais_servicos", "equipamentos", "rdos", "planos_manutencao",
            ],
            description: "Nome da tabela",
          },
          campo_status: { type: "string", description: "Nome do campo de status (ex: 'status', 'situacao'). Opcional." },
          valor_status: { type: "string", description: "Valor do status para filtrar. Opcional." },
        },
        required: ["tabela"],
      },
    },
  },
];

// Implementação
type ToolArgs = Record<string, unknown>;

const dataLimite = (dias?: number) => {
  if (!dias || dias <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
};

const fmtRC = (r: any) => ({
  numero: r.numero,
  data: r.data_criacao,
  solicitante: r.solicitante,
  centro_custo: r.centro_custo_nome || r.centro_custo,
  urgencia: r.urgencia,
  status: r.status,
  itens: Array.isArray(r.itens) ? r.itens.length : 0,
  justificativa: (r.justificativa || "").slice(0, 120),
});

const fmtOS = (r: any) => ({
  numero: r.numero,
  cliente: r.cliente_nome,
  situacao: r.situacao,
  prioridade: r.prioridade,
  data_inicio: r.data_inicio,
  servico: (r.descricao_servicos || r.servico || "").slice(0, 140),
});

const fmtSS = (r: any) => ({
  numero: r.numero,
  cliente: r.cliente_nome,
  situacao: r.situacao,
  prioridade: r.prioridade,
  data: r.data_hora_solicitacao,
  descricao: (r.descricao_servicos || "").slice(0, 140),
});

export async function executeTool(name: string, args: ToolArgs): Promise<unknown> {
  try {
    switch (name) {
      case "consultar_rcs": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        let q = supa.from("requisicoes_compras").select("numero,data_criacao,solicitante,centro_custo,centro_custo_nome,urgencia,status,itens,justificativa,created_at").order("created_at", { ascending: false }).limit(limite);
        if (args.status) q = q.eq("status", String(args.status));
        if (args.urgencia) q = q.eq("urgencia", String(args.urgencia));
        if (args.solicitante) q = q.ilike("solicitante", `%${args.solicitante}%`);
        if (args.centro_custo) q = q.ilike("centro_custo_nome", `%${args.centro_custo}%`);
        const dl = dataLimite(Number(args.dias_recentes ?? 30));
        if (dl) q = q.gte("created_at", dl);
        const { data, error } = await q;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, registros: (data ?? []).map(fmtRC) };
      }
      case "consultar_os": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        let q = supa.from("ordens_servico").select("numero,cliente_nome,situacao,prioridade,data_inicio,descricao_servicos,servico,created_at").order("created_at", { ascending: false }).limit(limite);
        if (args.situacao) q = q.eq("situacao", String(args.situacao));
        if (args.prioridade) q = q.ilike("prioridade", `%${args.prioridade}%`);
        if (args.cliente_nome) q = q.ilike("cliente_nome", `%${args.cliente_nome}%`);
        const dl = dataLimite(Number(args.dias_recentes ?? 60));
        if (dl) q = q.gte("created_at", dl);
        const { data, error } = await q;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, registros: (data ?? []).map(fmtOS) };
      }
      case "consultar_ss": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        let q = supa.from("solicitacoes_servicos").select("numero,cliente_nome,situacao,prioridade,data_hora_solicitacao,descricao_servicos,created_at").order("created_at", { ascending: false }).limit(limite);
        if (args.situacao) q = q.eq("situacao", String(args.situacao));
        if (args.prioridade) q = q.ilike("prioridade", `%${args.prioridade}%`);
        if (args.cliente_nome) q = q.ilike("cliente_nome", `%${args.cliente_nome}%`);
        const dl = dataLimite(Number(args.dias_recentes ?? 60));
        if (dl) q = q.gte("created_at", dl);
        const { data, error } = await q;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, registros: (data ?? []).map(fmtSS) };
      }
      case "consultar_funcionarios": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        let q = supa.from("funcionarios").select("nome,cpf,cargo,cliente_nome,situacao,data_admissao,telefone,email").limit(limite);
        if (args.nome) q = q.ilike("nome", `%${args.nome}%`);
        if (args.cargo) q = q.ilike("cargo", `%${args.cargo}%`);
        if (args.cliente_nome) q = q.ilike("cliente_nome", `%${args.cliente_nome}%`);
        if (args.situacao) q = q.eq("situacao", String(args.situacao));
        const { data, error } = await q;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, registros: data ?? [] };
      }
      case "consultar_estoque": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        const { data: movs, error } = await supa
          .from("estoque_movimentacoes")
          .select("material_id,material_nome,unidade,tipo,quantidade,valor_unitario")
          .limit(5000);
        if (error) return { erro: error.message };
        const mapa = new Map<string, any>();
        for (const m of movs ?? []) {
          const key = m.material_id || m.material_nome;
          if (!key) continue;
          const cur = mapa.get(key) || { material: m.material_nome, unidade: m.unidade, saldo: 0 };
          const qtd = Number(m.quantidade) || 0;
          cur.saldo += m.tipo === "Entrada" ? qtd : -qtd;
          mapa.set(key, cur);
        }
        let lista = [...mapa.values()];
        if (args.material_nome) {
          const term = String(args.material_nome).toLowerCase();
          lista = lista.filter(i => (i.material || "").toLowerCase().includes(term));
        }
        if (args.apenas_zerados) lista = lista.filter(i => i.saldo <= 0);
        lista.sort((a, b) => b.saldo - a.saldo);
        return { total: lista.length, registros: lista.slice(0, limite) };
      }
      case "consultar_processos_seletivos": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        let q = supa.from("processos_seletivos").select("*").order("created_at", { ascending: false }).limit(limite);
        if (args.status) q = q.eq("status", String(args.status));
        if (args.cargo) q = q.ilike("cargo", `%${args.cargo}%`);
        const { data, error } = await q;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, registros: (data ?? []).map((r: any) => ({
          id: r.id, cargo: r.cargo, status: r.status, candidatos: Array.isArray(r.candidatos) ? r.candidatos.length : 0,
          rc_numero: r.rc_numero, criado_em: r.created_at,
        })) };
      }
      case "consultar_pedidos_compra": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        let q = supa.from("pedidos_compra").select("*").order("created_at", { ascending: false }).limit(limite);
        if (args.status) q = q.eq("status", String(args.status));
        if (args.fornecedor_nome) q = q.ilike("fornecedor_nome", `%${args.fornecedor_nome}%`);
        const dl = dataLimite(Number(args.dias_recentes ?? 60));
        if (dl) q = q.gte("created_at", dl);
        const { data, error } = await q;
        if (error) return { erro: error.message };
        return { total: data?.length ?? 0, registros: (data ?? []).map((r: any) => ({
          numero: r.numero, fornecedor: r.fornecedor_nome, status: r.status,
          valor_total: r.valor_total, data: r.created_at,
        })) };
      }
      case "consultar_licitacoes": {
        const limite = Math.min(Number(args.limite ?? 50), 200);
        let q = supa.from("licitacoes").select("*").order("created_at", { ascending: false }).limit(limite);
        if (args.status) q = q.eq("status", String(args.status));
        const { data, error } = await q;
        if (error) return { erro: error.message };
        let lista = data ?? [];
        if (args.dias_ate_abertura) {
          const dias = Number(args.dias_ate_abertura);
          const limite2 = new Date();
          limite2.setDate(limite2.getDate() + dias);
          lista = lista.filter((l: any) => {
            if (!l.data_abertura) return false;
            const d = new Date(l.data_abertura);
            return d >= new Date() && d <= limite2;
          });
        }
        return { total: lista.length, registros: lista.map((r: any) => ({
          numero: r.numero, orgao: r.orgao, objeto: (r.objeto || "").slice(0, 140),
          modalidade: r.modalidade, status: r.status, data_abertura: r.data_abertura,
        })) };
      }
      case "contar_registros": {
        const tabela = String(args.tabela);
        let q = supa.from(tabela).select("*", { count: "exact", head: true });
        if (args.campo_status && args.valor_status) {
          q = q.eq(String(args.campo_status), String(args.valor_status));
        }
        const { count, error } = await q;
        if (error) return { erro: error.message };
        return { tabela, filtro: args.campo_status ? `${args.campo_status}=${args.valor_status}` : "todos", total: count ?? 0 };
      }
      default:
        return { erro: `Ferramenta desconhecida: ${name}` };
    }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : String(e) };
  }
}
