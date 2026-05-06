import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface ScoServico {
  codigo: string;
  descricao: string;
  unidade: string;
  preco: number;
  capitulo?: string;
  capitulo_descricao?: string;
  secao?: string;
  secao_descricao?: string;
  subsecao?: string;
  subsecao_descricao?: string;
}

export interface ScoElementar {
  codigo: string;
  descricao: string;
  unidade: string;
  grupo: string;
  preco: number;
}

export interface ScoComposicao {
  servico_codigo: string;
  elementar_codigo: string;
  elementar_descricao: string;
  unidade: string;
  quantidade: number;
}

export interface OrcamentoScoItem {
  servico_codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  preco_unit: number;
  preco_total: number;
}

export interface OrcamentoSco {
  id: string;
  numero: number;
  titulo: string;
  cliente_id?: string | null;
  cliente_nome?: string;
  obra?: string;
  tipo_analise: "sintetica" | "analitica";
  bdi: number;
  desconto: number;
  observacoes?: string;
  itens: OrcamentoScoItem[];
  subtotal: number;
  valor_total: number;
  status: string;
  criado_por?: string;
  created_at: string;
}

interface Ctx {
  orcamentos: OrcamentoSco[];
  loading: boolean;
  reload: () => Promise<void>;
  add: (o: Omit<OrcamentoSco, "id" | "numero" | "created_at">) => Promise<any>;
  update: (id: string, o: Partial<OrcamentoSco>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  // catalogo - search lazy
  searchServicos: (q: string, limit?: number) => Promise<ScoServico[]>;
  getServico: (codigo: string) => Promise<ScoServico | null>;
  getComposicao: (servico_codigo: string) => Promise<(ScoComposicao & { elementar_preco: number })[]>;
  getElementar: (codigo: string) => Promise<ScoElementar | null>;
  countCatalog: () => Promise<{ elementares: number; servicos: number; composicoes: number }>;
}

const C = createContext<Ctx | undefined>(undefined);

export function OrcamentosScoProvider({ children }: { children: ReactNode }) {
  const [orcamentos, setOrcamentos] = useState<OrcamentoSco[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchAll("orcamentos_sco", "numero");
    setOrcamentos(
      (data || []).map((r: any) => ({
        ...r,
        bdi: Number(r.bdi || 0),
        desconto: Number(r.desconto || 0),
        subtotal: Number(r.subtotal || 0),
        valor_total: Number(r.valor_total || 0),
        itens: Array.isArray(r.itens) ? r.itens : [],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add: Ctx["add"] = async (o) => {
    const r = await insertRow("orcamentos_sco", o);
    await reload();
    return r;
  };
  const update: Ctx["update"] = async (id, o) => { await updateRow("orcamentos_sco", id, o); await reload(); };
  const remove: Ctx["remove"] = async (id) => { await deleteRow("orcamentos_sco", id); await reload(); };

  const searchServicos: Ctx["searchServicos"] = async (q, limit = 30) => {
    const t = (q || "").trim();
    let query = (supabase as any).from("sco_servicos").select("codigo,descricao,unidade,preco,capitulo,secao,subsecao").limit(limit);
    if (t) {
      query = query.or(`codigo.ilike.%${t}%,descricao.ilike.%${t}%`);
    }
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return (data || []) as ScoServico[];
  };

  const getServico: Ctx["getServico"] = async (codigo) => {
    const { data } = await (supabase as any).from("sco_servicos").select("*").eq("codigo", codigo).maybeSingle();
    return data || null;
  };

  const getComposicao: Ctx["getComposicao"] = async (servico_codigo) => {
    const { data, error } = await (supabase as any)
      .from("sco_composicoes").select("*").eq("servico_codigo", servico_codigo);
    if (error || !data) return [];
    const codes = data.map((c: any) => c.elementar_codigo).filter(Boolean);
    let precos: Record<string, number> = {};
    if (codes.length) {
      const { data: els } = await (supabase as any)
        .from("sco_elementares").select("codigo,preco").in("codigo", codes);
      precos = Object.fromEntries((els || []).map((e: any) => [e.codigo, Number(e.preco || 0)]));
    }
    return data.map((c: any) => ({
      ...c,
      quantidade: Number(c.quantidade || 0),
      elementar_preco: precos[c.elementar_codigo] || 0,
    }));
  };

  const getElementar: Ctx["getElementar"] = async (codigo) => {
    const { data } = await (supabase as any).from("sco_elementares").select("*").eq("codigo", codigo).maybeSingle();
    return data || null;
  };

  const countCatalog: Ctx["countCatalog"] = async () => {
    const [a, b, c] = await Promise.all([
      (supabase as any).from("sco_elementares").select("codigo", { count: "exact", head: true }),
      (supabase as any).from("sco_servicos").select("codigo", { count: "exact", head: true }),
      (supabase as any).from("sco_composicoes").select("id", { count: "exact", head: true }),
    ]);
    return { elementares: a.count || 0, servicos: b.count || 0, composicoes: c.count || 0 };
  };

  return (
    <C.Provider value={{ orcamentos, loading, reload, add, update, remove, searchServicos, getServico, getComposicao, getElementar, countCatalog }}>
      {children}
    </C.Provider>
  );
}

export function useOrcamentosSco() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useOrcamentosSco must be inside OrcamentosScoProvider");
  return ctx;
}
