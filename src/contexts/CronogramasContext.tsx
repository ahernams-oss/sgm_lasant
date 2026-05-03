import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { toast } from "sonner";

export interface CronogramaPeriodo {
  rotulo: string;
  inicio: string;
  fim: string;
}

export interface CronogramaAtividadeValor {
  previsto_fisico: number;
  previsto_financeiro: number;
  realizado_fisico: number;
  realizado_financeiro: number;
}

export interface CronogramaAtividade {
  id: string;
  ordem: number;
  descricao: string;
  unidade: string;
  quantidade: number;
  peso: number;
  valor_total: number;
  modo_financeiro: "distribuido" | "manual";
  valores: Record<string, CronogramaAtividadeValor>;
  vincular_rdo: boolean;
}

export interface Cronograma {
  id: string;
  numero: number;
  cliente_id: string;
  cliente_nome: string;
  obra: string;
  descricao: string;
  responsavel: string;
  data_inicio: string;
  data_fim: string;
  granularidade: "mensal" | "semanal";
  valor_total: number;
  atividades: CronogramaAtividade[];
  periodos: CronogramaPeriodo[];
  status: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

interface CronogramasContextType {
  cronogramas: Cronograma[];
  loading: boolean;
  addCronograma: (c: Partial<Cronograma>) => Promise<Cronograma | null>;
  updateCronograma: (id: string, c: Partial<Cronograma>) => Promise<boolean>;
  deleteCronograma: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const CronogramasContext = createContext<CronogramasContextType>({} as CronogramasContextType);
export const useCronogramas = () => useContext(CronogramasContext);

export function CronogramasProvider({ children }: { children: ReactNode }) {
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchAll("cronogramas", "created_at");
    setCronogramas((data as Cronograma[]).reverse());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addCronograma = async (c: Partial<Cronograma>) => {
    const data = await insertRow("cronogramas", c);
    if (data) {
      await load();
      toast.success("Cronograma criado!");
    }
    return data;
  };

  const updateCronograma = async (id: string, c: Partial<Cronograma>) => {
    const ok = await updateRow("cronogramas", id, { ...c, updated_at: new Date().toISOString() });
    if (ok) {
      await load();
      toast.success("Cronograma atualizado!");
    }
    return ok;
  };

  const deleteCronograma = async (id: string) => {
    const ok = await deleteRow("cronogramas", id);
    if (ok) {
      await load();
      toast.success("Cronograma removido!");
    }
    return ok;
  };

  return (
    <CronogramasContext.Provider value={{ cronogramas, loading, addCronograma, updateCronograma, deleteCronograma, refresh: load }}>
      {children}
    </CronogramasContext.Provider>
  );
}

// ===== Helpers =====
export function gerarPeriodos(inicio: string, fim: string, granularidade: "mensal" | "semanal"): CronogramaPeriodo[] {
  if (!inicio || !fim) return [];
  const dIni = new Date(inicio + "T00:00:00");
  const dFim = new Date(fim + "T00:00:00");
  if (isNaN(dIni.getTime()) || isNaN(dFim.getTime()) || dFim < dIni) return [];

  const periodos: CronogramaPeriodo[] = [];
  if (granularidade === "mensal") {
    const cur = new Date(dIni.getFullYear(), dIni.getMonth(), 1);
    const last = new Date(dFim.getFullYear(), dFim.getMonth(), 1);
    while (cur <= last) {
      const ini = new Date(cur);
      const fimMes = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      periodos.push({
        rotulo: `${meses[cur.getMonth()]}/${String(cur.getFullYear()).slice(-2)}`,
        inicio: ini.toISOString().slice(0, 10),
        fim: fimMes.toISOString().slice(0, 10),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    const cur = new Date(dIni);
    let n = 1;
    while (cur <= dFim) {
      const ini = new Date(cur);
      const fimSem = new Date(cur);
      fimSem.setDate(fimSem.getDate() + 6);
      periodos.push({
        rotulo: `S${n}`,
        inicio: ini.toISOString().slice(0, 10),
        fim: (fimSem > dFim ? dFim : fimSem).toISOString().slice(0, 10),
      });
      cur.setDate(cur.getDate() + 7);
      n++;
    }
  }
  return periodos;
}
