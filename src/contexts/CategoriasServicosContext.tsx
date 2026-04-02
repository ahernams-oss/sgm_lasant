import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface CategoriaServico {
  id: string;
  nome: string;
  descricao: string;
}

interface CategoriasServicosContextType {
  categorias: CategoriaServico[];
  addCategoria: (c: Omit<CategoriaServico, "id">) => Promise<void>;
  updateCategoria: (id: string, data: Partial<Omit<CategoriaServico, "id">>) => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
}

const CategoriasServicosContext = createContext<CategoriasServicosContextType | undefined>(undefined);

export function CategoriasServicosProvider({ children }: { children: ReactNode }) {
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("categorias_servicos", "nome");
    setCategorias(data.map((r: any) => ({ id: r.id, nome: r.nome ?? "", descricao: r.descricao ?? "" })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCategoria = async (c: Omit<CategoriaServico, "id">) => {
    await insertRow("categorias_servicos", { nome: c.nome, descricao: c.descricao });
    await load();
  };

  const updateCategoria = async (id: string, data: Partial<Omit<CategoriaServico, "id">>) => {
    await updateRow("categorias_servicos", id, data);
    await load();
  };

  const deleteCategoria = async (id: string) => {
    await deleteRow("categorias_servicos", id);
    await load();
  };

  return (
    <CategoriasServicosContext.Provider value={{ categorias, addCategoria, updateCategoria, deleteCategoria }}>
      {children}
    </CategoriasServicosContext.Provider>
  );
}

export function useCategoriasServicos() {
  const ctx = useContext(CategoriasServicosContext);
  if (!ctx) throw new Error("useCategoriasServicos must be used within CategoriasServicosProvider");
  return ctx;
}
