import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface EpiCatalogo {
  id: string;
  codigo: string;
  descricao: string;
  ca: string;
  validadeMeses: number | null;
  observacao: string;
}

interface Ctx {
  epis: EpiCatalogo[];
  addEpi: (e: Omit<EpiCatalogo, "id">) => Promise<void>;
  updateEpi: (id: string, e: Partial<Omit<EpiCatalogo, "id">>) => Promise<void>;
  deleteEpi: (id: string) => Promise<void>;
}

const EpisCatalogoContext = createContext<Ctx | undefined>(undefined);

const rowTo = (r: any): EpiCatalogo => ({
  id: r.id,
  codigo: r.codigo ?? "",
  descricao: r.descricao ?? "",
  ca: r.ca ?? "",
  validadeMeses: r.validade_meses ?? null,
  observacao: r.observacao ?? "",
});

const toRow = (e: Omit<EpiCatalogo, "id">) => ({
  codigo: e.codigo || null,
  descricao: e.descricao,
  ca: e.ca || null,
  validade_meses: e.validadeMeses,
  observacao: e.observacao || null,
});

export function EpisCatalogoProvider({ children }: { children: ReactNode }) {
  const [epis, setEpis] = useState<EpiCatalogo[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("epis_catalogo", "descricao");
    setEpis(data.map(rowTo));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addEpi = async (e: Omit<EpiCatalogo, "id">) => {
    await insertRow("epis_catalogo", toRow(e));
    await load();
  };

  const updateEpi = async (id: string, e: Partial<Omit<EpiCatalogo, "id">>) => {
    const current = epis.find((x) => x.id === id);
    if (!current) return;
    const merged = { ...current, ...e };
    const { id: _, ...rest } = merged;
    await updateRow("epis_catalogo", id, toRow(rest));
    await load();
  };

  const deleteEpi = async (id: string) => {
    await deleteRow("epis_catalogo", id);
    await load();
  };

  return (
    <EpisCatalogoContext.Provider value={{ epis, addEpi, updateEpi, deleteEpi }}>
      {children}
    </EpisCatalogoContext.Provider>
  );
}

export function useEpisCatalogo() {
  const ctx = useContext(EpisCatalogoContext);
  if (!ctx) throw new Error("useEpisCatalogo must be used within EpisCatalogoProvider");
  return ctx;
}
