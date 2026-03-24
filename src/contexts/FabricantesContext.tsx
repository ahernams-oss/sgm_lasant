import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface Fabricante { id: string; nome: string; }

interface FabricantesContextType {
  fabricantes: Fabricante[]; addFabricante: (nome: string) => void;
  updateFabricante: (id: string, nome: string) => void;
  deleteFabricante: (id: string) => void;
}

const FabricantesContext = createContext<FabricantesContextType | undefined>(undefined);

export function FabricantesProvider({ children }: { children: ReactNode }) {
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("fabricantes", "nome");
    setFabricantes(data.map((r: any) => ({ id: r.id, nome: r.nome ?? "" })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addFabricante = async (nome: string) => {
    await insertRow("fabricantes", { nome });
    await load();
  };

  const updateFabricante = async (id: string, nome: string) => {
    await updateRow("fabricantes", id, { nome });
    await load();
  };

  const deleteFabricante = async (id: string) => {
    await deleteRow("fabricantes", id);
    await load();
  };

  return (
    <FabricantesContext.Provider value={{ fabricantes, addFabricante, updateFabricante, deleteFabricante }}>
      {children}
    </FabricantesContext.Provider>
  );
}

export function useFabricantes() {
  const ctx = useContext(FabricantesContext);
  if (!ctx) throw new Error("useFabricantes must be used within FabricantesProvider");
  return ctx;
}
