import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  categoriaId: string;
}

interface ServicosContextType {
  servicos: Servico[];
  addServico: (s: Omit<Servico, "id">) => Promise<void>;
  updateServico: (id: string, data: Partial<Omit<Servico, "id">>) => Promise<void>;
  deleteServico: (id: string) => Promise<void>;
}

const ServicosContext = createContext<ServicosContextType | undefined>(undefined);

const rowToServico = (r: any): Servico => ({
  id: r.id,
  nome: r.nome ?? "",
  descricao: r.descricao ?? "",
  categoriaId: r.categoria_id ?? "",
});

export function ServicosProvider({ children }: { children: ReactNode }) {
  const [servicos, setServicos] = useState<Servico[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("servicos", "nome");
    setServicos(data.map(rowToServico));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addServico = async (s: Omit<Servico, "id">) => {
    await insertRow("servicos", { nome: s.nome, descricao: s.descricao, categoria_id: s.categoriaId || null });
    await load();
  };

  const updateServico = async (id: string, data: Partial<Omit<Servico, "id">>) => {
    const row: any = {};
    if (data.nome !== undefined) row.nome = data.nome;
    if (data.descricao !== undefined) row.descricao = data.descricao;
    if (data.categoriaId !== undefined) row.categoria_id = data.categoriaId || null;
    await updateRow("servicos", id, row);
    await load();
  };

  const deleteServico = async (id: string) => {
    await deleteRow("servicos", id);
    await load();
  };

  return (
    <ServicosContext.Provider value={{ servicos, addServico, updateServico, deleteServico }}>
      {children}
    </ServicosContext.Provider>
  );
}

export function useServicos() {
  const ctx = useContext(ServicosContext);
  if (!ctx) throw new Error("useServicos must be used within ServicosProvider");
  return ctx;
}
