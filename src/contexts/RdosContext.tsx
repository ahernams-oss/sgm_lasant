import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RdoEfetivoItem {
  funcao: string;
  quantidade: number;
  horas: number;
}
export interface RdoEquipamentoItem {
  descricao: string;
  quantidade: number;
  horas: number;
}
export interface RdoAtividadeItem {
  descricao: string;
  percentual_avanco: number;
  observacao: string;
}
export interface RdoAnexo {
  nome: string;
  url: string;
  tipo: string;
}

export interface Rdo {
  id: string;
  numero: number;
  data_rdo: string;
  cliente_id: string;
  cliente_nome: string;
  obra: string;
  responsavel: string;
  clima_manha: string;
  clima_tarde: string;
  clima_noite: string;
  condicao_manha: string;
  condicao_tarde: string;
  condicao_noite: string;
  efetivo: RdoEfetivoItem[];
  equipamentos: RdoEquipamentoItem[];
  atividades: RdoAtividadeItem[];
  avanco_fisico_geral: number;
  ocorrencias: string;
  observacoes: string;
  anexos: RdoAnexo[];
  assinatura_responsavel: string;
  assinatura_responsavel_nome: string;
  assinatura_fiscalizacao: string;
  assinatura_fiscalizacao_nome: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface RdosContextType {
  rdos: Rdo[];
  loading: boolean;
  addRdo: (r: Partial<Rdo>) => Promise<Rdo | null>;
  updateRdo: (id: string, r: Partial<Rdo>) => Promise<boolean>;
  deleteRdo: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  uploadAnexo: (file: File, rdoId: string) => Promise<string | null>;
}

const RdosContext = createContext<RdosContextType>({} as RdosContextType);
export const useRdos = () => useContext(RdosContext);

export function RdosProvider({ children }: { children: ReactNode }) {
  const [rdos, setRdos] = useState<Rdo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchAll("rdos", "data_rdo");
    setRdos((data as Rdo[]).reverse());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addRdo = async (r: Partial<Rdo>) => {
    const data = await insertRow("rdos", r);
    if (data) {
      await load();
      toast.success("RDO registrado com sucesso!");
    }
    return data;
  };

  const updateRdo = async (id: string, r: Partial<Rdo>) => {
    const ok = await updateRow("rdos", id, { ...r, updated_at: new Date().toISOString() });
    if (ok) {
      await load();
      toast.success("RDO atualizado!");
    }
    return ok;
  };

  const deleteRdo = async (id: string) => {
    const ok = await deleteRow("rdos", id);
    if (ok) {
      await load();
      toast.success("RDO removido!");
    }
    return ok;
  };

  const uploadAnexo = async (file: File, rdoId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${rdoId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("rdo-anexos").upload(path, file);
    if (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload do arquivo.");
      return null;
    }
    const { data: urlData } = supabase.storage.from("rdo-anexos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  return (
    <RdosContext.Provider value={{ rdos, loading, addRdo, updateRdo, deleteRdo, refresh: load, uploadAnexo }}>
      {children}
    </RdosContext.Provider>
  );
}
