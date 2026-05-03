import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { toast } from "sonner";

export interface BimQuantitativo {
  id: string;
  modelo_id: string;
  categoria: string;
  elemento: string;
  quantidade: number;
  unidade: string;
  observacao: string;
  cronograma_atividade_id?: string;
  cronograma_id?: string | null;
  created_at: string;
}

export interface BimPrancha {
  id: string;
  modelo_id: string;
  codigo: string;
  titulo: string;
  escala: string;
  revisao: string;
  data_revisao: string | null;
  arquivo_url: string;
  arquivo_nome: string;
  observacao: string;
  created_at: string;
}

export interface BimModelo {
  id: string;
  numero: number;
  cliente_id: string;
  cliente_nome: string;
  obra: string;
  nome: string;
  descricao: string;
  disciplina: string;
  versao: string;
  status: string;
  responsavel_tecnico: string;
  data_upload: string | null;
  formato: string;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  thumbnail_url: string;
  tags: string[];
  observacoes: string;
  created_at: string;
  updated_at: string;
}

interface BimContextType {
  modelos: BimModelo[];
  quantitativos: BimQuantitativo[];
  pranchas: BimPrancha[];
  loading: boolean;
  addModelo: (m: Partial<BimModelo>) => Promise<BimModelo | null>;
  updateModelo: (id: string, m: Partial<BimModelo>) => Promise<boolean>;
  deleteModelo: (id: string) => Promise<boolean>;
  addQuantitativo: (q: Partial<BimQuantitativo>) => Promise<BimQuantitativo | null>;
  updateQuantitativo: (id: string, q: Partial<BimQuantitativo>) => Promise<boolean>;
  deleteQuantitativo: (id: string) => Promise<boolean>;
  addPrancha: (p: Partial<BimPrancha>) => Promise<BimPrancha | null>;
  updatePrancha: (id: string, p: Partial<BimPrancha>) => Promise<boolean>;
  deletePrancha: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const BimContext = createContext<BimContextType>({} as BimContextType);

export function BimProvider({ children }: { children: ReactNode }) {
  const [modelos, setModelos] = useState<BimModelo[]>([]);
  const [quantitativos, setQuantitativos] = useState<BimQuantitativo[]>([]);
  const [pranchas, setPranchas] = useState<BimPrancha[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [m, q, p] = await Promise.all([
      fetchAll("bim_modelos", "numero"),
      fetchAll("bim_quantitativos"),
      fetchAll("bim_pranchas"),
    ]);
    setModelos((m as BimModelo[]) || []);
    setQuantitativos((q as BimQuantitativo[]) || []);
    setPranchas((p as BimPrancha[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addModelo = async (m: Partial<BimModelo>) => {
    const row = await insertRow("bim_modelos", m);
    if (row) {
      setModelos((prev) => [...prev, row as BimModelo]);
      toast.success("Modelo BIM cadastrado!");
    }
    return row;
  };

  const updateModelo = async (id: string, m: Partial<BimModelo>) => {
    const ok = await updateRow("bim_modelos", id, m);
    if (ok) {
      setModelos((prev) => prev.map((x) => (x.id === id ? { ...x, ...m } as BimModelo : x)));
      toast.success("Modelo atualizado!");
    }
    return ok;
  };

  const deleteModelo = async (id: string) => {
    const ok = await deleteRow("bim_modelos", id);
    if (ok) {
      setModelos((prev) => prev.filter((x) => x.id !== id));
      setQuantitativos((prev) => prev.filter((x) => x.modelo_id !== id));
      setPranchas((prev) => prev.filter((x) => x.modelo_id !== id));
      toast.success("Modelo removido!");
    }
    return ok;
  };

  const addQuantitativo = async (q: Partial<BimQuantitativo>) => {
    const row = await insertRow("bim_quantitativos", q);
    if (row) setQuantitativos((prev) => [...prev, row as BimQuantitativo]);
    return row;
  };
  const updateQuantitativo = async (id: string, q: Partial<BimQuantitativo>) => {
    const ok = await updateRow("bim_quantitativos", id, q);
    if (ok) setQuantitativos((prev) => prev.map((x) => (x.id === id ? { ...x, ...q } as BimQuantitativo : x)));
    return ok;
  };
  const deleteQuantitativo = async (id: string) => {
    const ok = await deleteRow("bim_quantitativos", id);
    if (ok) setQuantitativos((prev) => prev.filter((x) => x.id !== id));
    return ok;
  };

  const addPrancha = async (p: Partial<BimPrancha>) => {
    const row = await insertRow("bim_pranchas", p);
    if (row) setPranchas((prev) => [...prev, row as BimPrancha]);
    return row;
  };
  const updatePrancha = async (id: string, p: Partial<BimPrancha>) => {
    const ok = await updateRow("bim_pranchas", id, p);
    if (ok) setPranchas((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } as BimPrancha : x)));
    return ok;
  };
  const deletePrancha = async (id: string) => {
    const ok = await deleteRow("bim_pranchas", id);
    if (ok) setPranchas((prev) => prev.filter((x) => x.id !== id));
    return ok;
  };

  return (
    <BimContext.Provider
      value={{
        modelos,
        quantitativos,
        pranchas,
        loading,
        addModelo,
        updateModelo,
        deleteModelo,
        addQuantitativo,
        updateQuantitativo,
        deleteQuantitativo,
        addPrancha,
        updatePrancha,
        deletePrancha,
        refresh,
      }}
    >
      {children}
    </BimContext.Provider>
  );
}

export const useBim = () => useContext(BimContext);
