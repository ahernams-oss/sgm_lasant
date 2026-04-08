import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProcessoTrabalhista {
  id: string;
  numero_processo: string;
  vara: string;
  comarca: string;
  estado: string;
  autor_nome: string;
  autor_cpf: string;
  advogado_autor: string;
  advogado_empresa: string;
  data_distribuicao: string | null;
  objeto_acao: string;
  valor_causa: number;
  provisao_contabil: number;
  valor_acordo: number;
  valor_condenacao: number;
  honorarios: number;
  risco: string;
  status: string;
  fase_processual: string;
  observacoes: string;
  anexos: any[];
  cliente_id: string;
  cliente_nome: string;
}

export interface Andamento {
  id: string;
  processo_id: string;
  tipo: string;
  data_andamento: string | null;
  descricao: string;
  responsavel: string;
  prazo_limite: string | null;
  status_prazo: string;
}

interface ContextType {
  processos: ProcessoTrabalhista[];
  andamentos: Andamento[];
  loading: boolean;
  addProcesso: (p: Omit<ProcessoTrabalhista, "id">) => Promise<void>;
  updateProcesso: (id: string, data: Partial<ProcessoTrabalhista>) => Promise<void>;
  deleteProcesso: (id: string) => Promise<void>;
  addAndamento: (a: Omit<Andamento, "id">) => Promise<void>;
  updateAndamento: (id: string, data: Partial<Andamento>) => Promise<void>;
  deleteAndamento: (id: string) => Promise<void>;
  loadAndamentos: (processoId: string) => Promise<Andamento[]>;
}

const Ctx = createContext<ContextType | undefined>(undefined);

export function ProcessosTrabalhalistasProvider({ children }: { children: ReactNode }) {
  const [processos, setProcessos] = useState<ProcessoTrabalhista[]>([]);
  const [andamentos, setAndamentos] = useState<Andamento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAll("processos_trabalhistas", "created_at");
    setProcessos(data.map((r: any) => ({
      id: r.id,
      numero_processo: r.numero_processo ?? "",
      vara: r.vara ?? "",
      comarca: r.comarca ?? "",
      estado: r.estado ?? "",
      autor_nome: r.autor_nome ?? "",
      autor_cpf: r.autor_cpf ?? "",
      advogado_autor: r.advogado_autor ?? "",
      advogado_empresa: r.advogado_empresa ?? "",
      data_distribuicao: r.data_distribuicao ?? null,
      objeto_acao: r.objeto_acao ?? "",
      valor_causa: Number(r.valor_causa) || 0,
      provisao_contabil: Number(r.provisao_contabil) || 0,
      valor_acordo: Number(r.valor_acordo) || 0,
      valor_condenacao: Number(r.valor_condenacao) || 0,
      honorarios: Number(r.honorarios) || 0,
      risco: r.risco ?? "Médio",
      status: r.status ?? "Ativo",
      fase_processual: r.fase_processual ?? "Inicial",
      observacoes: r.observacoes ?? "",
      anexos: Array.isArray(r.anexos) ? r.anexos : [],
      cliente_id: r.cliente_id ?? "",
      cliente_nome: r.cliente_nome ?? "",
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addProcesso = async (p: Omit<ProcessoTrabalhista, "id">) => {
    await insertRow("processos_trabalhistas", p);
    await load();
  };
  const updateProcesso = async (id: string, data: Partial<ProcessoTrabalhista>) => {
    await updateRow("processos_trabalhistas", id, data);
    await load();
  };
  const deleteProcesso = async (id: string) => {
    await deleteRow("processos_trabalhistas", id);
    await load();
  };

  const loadAndamentos = useCallback(async (processoId: string): Promise<Andamento[]> => {
    const { data, error } = await (supabase as any)
      .from("processos_trabalhistas_andamentos")
      .select("*")
      .eq("processo_id", processoId)
      .order("data_andamento", { ascending: false });
    if (error) { console.error(error); toast.error("Erro ao carregar andamentos"); return []; }
    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      processo_id: r.processo_id,
      tipo: r.tipo ?? "Outros",
      data_andamento: r.data_andamento ?? null,
      descricao: r.descricao ?? "",
      responsavel: r.responsavel ?? "",
      prazo_limite: r.prazo_limite ?? null,
      status_prazo: r.status_prazo ?? "Pendente",
    }));
    setAndamentos(mapped);
    return mapped;
  }, []);

  const addAndamento = async (a: Omit<Andamento, "id">) => {
    await insertRow("processos_trabalhistas_andamentos", a);
    await loadAndamentos(a.processo_id);
  };
  const updateAndamento = async (id: string, data: Partial<Andamento>) => {
    await updateRow("processos_trabalhistas_andamentos", id, data);
    if (data.processo_id) await loadAndamentos(data.processo_id);
  };
  const deleteAndamento = async (id: string) => {
    const a = andamentos.find(x => x.id === id);
    await deleteRow("processos_trabalhistas_andamentos", id);
    if (a) await loadAndamentos(a.processo_id);
  };

  return (
    <Ctx.Provider value={{ processos, andamentos, loading, addProcesso, updateProcesso, deleteProcesso, addAndamento, updateAndamento, deleteAndamento, loadAndamentos }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProcessosTrabalhistas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProcessosTrabalhistas must be used within Provider");
  return ctx;
}
