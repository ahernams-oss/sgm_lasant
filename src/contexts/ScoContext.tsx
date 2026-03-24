import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export type TipoSco = "SCO" | "SINAPI" | "EMOP";
export const tiposSco: TipoSco[] = ["SCO", "SINAPI", "EMOP"];

export interface Sco { id: string; codSco: string; descricaoSco: string; unidade: string; tipo: TipoSco; }

export const emptyScoForm: Omit<Sco, "id"> = { codSco: "", descricaoSco: "", unidade: "", tipo: "SCO" };

interface ScoContextType {
  scos: Sco[]; addSco: (s: Omit<Sco, "id">) => void;
  updateSco: (id: string, s: Partial<Omit<Sco, "id">>) => void;
  deleteSco: (id: string) => void;
}

const ScoContext = createContext<ScoContextType | undefined>(undefined);

const rowToSco = (r: any): Sco => ({
  id: r.id, codSco: r.cod_sco ?? "", descricaoSco: r.descricao_sco ?? "",
  unidade: r.unidade ?? "", tipo: r.tipo ?? "SCO",
});

const scoToRow = (s: Omit<Sco, "id">) => ({
  cod_sco: s.codSco, descricao_sco: s.descricaoSco, unidade: s.unidade, tipo: s.tipo,
});

export function ScoProvider({ children }: { children: ReactNode }) {
  const [scos, setScos] = useState<Sco[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("scos", "cod_sco");
    setScos(data.map(rowToSco));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addSco = async (s: Omit<Sco, "id">) => { await insertRow("scos", scoToRow(s)); await load(); };
  const updateSco = async (id: string, data: Partial<Omit<Sco, "id">>) => {
    const current = scos.find(s => s.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    const { id: _, ...rest } = merged;
    await updateRow("scos", id, scoToRow(rest));
    await load();
  };
  const deleteSco = async (id: string) => { await deleteRow("scos", id); await load(); };

  return (
    <ScoContext.Provider value={{ scos, addSco, updateSco, deleteSco }}>
      {children}
    </ScoContext.Provider>
  );
}

export function useSco() {
  const ctx = useContext(ScoContext);
  if (!ctx) throw new Error("useSco must be used within ScoProvider");
  return ctx;
}
