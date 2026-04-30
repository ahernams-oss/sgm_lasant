import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { toast } from "sonner";

export interface ChecklistItem {
  id: string;
  descricao: string;
  obrigatorio?: boolean;
}

export interface PlanoManutencao {
  id: string;
  titulo: string;
  cliente_id: string;
  cliente_nome: string;
  contrato: string;
  vigencia_inicio: string;
  vigencia_fim: string;
  responsavel_tecnico_id: string;
  responsavel_tecnico_nome: string;
  status: string;
  escopo: string;
  observacoes: string;
  equipamentos_cobertos: any[];
  anexos: any[];
  created_at: string;
  updated_at: string;
}

export interface PlanoAtividade {
  id: string;
  plano_id: string;
  descricao: string;
  equipamento_id: string;
  equipamento_nome: string;
  tipo: string;
  periodicidade: string;
  prioridade: string;
  responsavel: string;
  checklist: ChecklistItem[];
  anexos: any[];
  ultima_execucao: string;
  proxima_execucao: string;
  status: string;
  observacoes: string;
}

export interface PlanoExecucao {
  id: string;
  plano_id: string;
  atividade_id: string;
  data_execucao: string;
  responsavel: string;
  observacoes: string;
  percentual_conformidade: number;
  checklist_resultado: any[];
  os_id: string;
  os_numero: number;
  evidencias: any[];
  created_at: string;
}

interface Ctx {
  planos: PlanoManutencao[];
  atividades: PlanoAtividade[];
  execucoes: PlanoExecucao[];
  loading: boolean;
  refresh: () => Promise<void>;
  addPlano: (p: Partial<PlanoManutencao>) => Promise<PlanoManutencao | null>;
  updatePlano: (id: string, p: Partial<PlanoManutencao>) => Promise<boolean>;
  deletePlano: (id: string) => Promise<boolean>;
  addAtividade: (a: Partial<PlanoAtividade>) => Promise<PlanoAtividade | null>;
  updateAtividade: (id: string, a: Partial<PlanoAtividade>) => Promise<boolean>;
  deleteAtividade: (id: string) => Promise<boolean>;
  addExecucao: (e: Partial<PlanoExecucao>) => Promise<PlanoExecucao | null>;
  deleteExecucao: (id: string) => Promise<boolean>;
}

const PlanosManutencaoContext = createContext<Ctx>({} as Ctx);
export const usePlanosManutencao = () => useContext(PlanosManutencaoContext);

export function PlanosManutencaoProvider({ children }: { children: ReactNode }) {
  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [atividades, setAtividades] = useState<PlanoAtividade[]>([]);
  const [execucoes, setExecucoes] = useState<PlanoExecucao[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [p, a, e] = await Promise.all([
      fetchAll("planos_manutencao"),
      fetchAll("plano_manutencao_atividades"),
      fetchAll("plano_manutencao_execucoes"),
    ]);
    setPlanos(p as PlanoManutencao[]);
    setAtividades(a as PlanoAtividade[]);
    setExecucoes(e as PlanoExecucao[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addPlano = async (p: Partial<PlanoManutencao>) => {
    const data = await insertRow("planos_manutencao", p);
    if (data) { await load(); toast.success("Plano criado!"); }
    return data;
  };
  const updatePlano = async (id: string, p: Partial<PlanoManutencao>) => {
    const ok = await updateRow("planos_manutencao", id, p);
    if (ok) { await load(); toast.success("Plano atualizado!"); }
    return ok;
  };
  const deletePlano = async (id: string) => {
    const ok = await deleteRow("planos_manutencao", id);
    if (ok) { await load(); toast.success("Plano removido!"); }
    return ok;
  };

  const addAtividade = async (a: Partial<PlanoAtividade>) => {
    const data = await insertRow("plano_manutencao_atividades", a);
    if (data) { await load(); toast.success("Atividade adicionada!"); }
    return data;
  };
  const updateAtividade = async (id: string, a: Partial<PlanoAtividade>) => {
    const ok = await updateRow("plano_manutencao_atividades", id, a);
    if (ok) { await load(); toast.success("Atividade atualizada!"); }
    return ok;
  };
  const deleteAtividade = async (id: string) => {
    const ok = await deleteRow("plano_manutencao_atividades", id);
    if (ok) { await load(); toast.success("Atividade removida!"); }
    return ok;
  };

  const addExecucao = async (e: Partial<PlanoExecucao>) => {
    const data = await insertRow("plano_manutencao_execucoes", e);
    if (data) {
      // atualiza ultima_execucao da atividade
      if (e.atividade_id && e.data_execucao) {
        await updateRow("plano_manutencao_atividades", e.atividade_id, { ultima_execucao: e.data_execucao });
      }
      await load();
      toast.success("Execução registrada!");
    }
    return data;
  };
  const deleteExecucao = async (id: string) => {
    const ok = await deleteRow("plano_manutencao_execucoes", id);
    if (ok) { await load(); toast.success("Execução removida!"); }
    return ok;
  };

  return (
    <PlanosManutencaoContext.Provider value={{
      planos, atividades, execucoes, loading, refresh: load,
      addPlano, updatePlano, deletePlano,
      addAtividade, updateAtividade, deleteAtividade,
      addExecucao, deleteExecucao,
    }}>
      {children}
    </PlanosManutencaoContext.Provider>
  );
}
