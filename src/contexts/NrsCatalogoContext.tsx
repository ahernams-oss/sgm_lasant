import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface NrCatalogo {
  id: string;
  codigo: string;
  descricao: string;
  dataValidade: string;
}

interface Ctx {
  nrs: NrCatalogo[];
  addNr: (n: Omit<NrCatalogo, "id">) => Promise<void>;
  updateNr: (id: string, n: Partial<Omit<NrCatalogo, "id">>) => Promise<void>;
  deleteNr: (id: string) => Promise<void>;
}

const NrsCatalogoContext = createContext<Ctx | undefined>(undefined);

const rowTo = (r: any): NrCatalogo => ({
  id: r.id,
  codigo: r.codigo ?? "",
  descricao: r.descricao ?? "",
  dataValidade: r.data_validade ?? "",
});

const toRow = (n: Omit<NrCatalogo, "id">) => ({
  codigo: n.codigo,
  descricao: n.descricao,
  data_validade: n.dataValidade || null,
});

const QK = ["nrs_catalogo"] as const;

export function NrsCatalogoProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: nrs = [] } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const data = await fetchAll("nrs_catalogo", "codigo");
      return data.map(rowTo) as NrCatalogo[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK });

  const addNr = async (n: Omit<NrCatalogo, "id">) => {
    await insertRow("nrs_catalogo", toRow(n));
    await invalidate();
  };

  const updateNr = async (id: string, n: Partial<Omit<NrCatalogo, "id">>) => {
    const current = nrs.find((x) => x.id === id);
    if (!current) return;
    const { id: _, ...rest } = { ...current, ...n };
    await updateRow("nrs_catalogo", id, toRow(rest));
    await invalidate();
  };

  const deleteNr = async (id: string) => {
    await deleteRow("nrs_catalogo", id);
    await invalidate();
  };

  return (
    <NrsCatalogoContext.Provider value={{ nrs, addNr, updateNr, deleteNr }}>
      {children}
    </NrsCatalogoContext.Provider>
  );
}

export function useNrsCatalogo() {
  const ctx = useContext(NrsCatalogoContext);
  if (!ctx) throw new Error("useNrsCatalogo must be used within NrsCatalogoProvider");
  return ctx;
}
