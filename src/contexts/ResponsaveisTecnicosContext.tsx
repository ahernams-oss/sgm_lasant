import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ResponsavelTecnico {
  id: string;
  nome: string;
  titulo: string;
  crea: string;
  cpf: string;
  carteira_crea_url?: string | null;
  carteira_crea_nome?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Ctx {
  responsaveis: ResponsavelTecnico[];
  loading: boolean;
  add: (r: Partial<ResponsavelTecnico>) => Promise<ResponsavelTecnico | null>;
  update: (id: string, r: Partial<ResponsavelTecnico>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  uploadCarteira: (file: File) => Promise<{ url: string; nome: string } | null>;
  refresh: () => Promise<void>;
}

const ResponsaveisTecnicosContext = createContext<Ctx>({} as Ctx);
export const useResponsaveisTecnicos = () => useContext(ResponsaveisTecnicosContext);

export function ResponsaveisTecnicosProvider({ children }: { children: ReactNode }) {
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAll("responsaveis_tecnicos", "nome");
    setResponsaveis(data as ResponsavelTecnico[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (r: Partial<ResponsavelTecnico>) => {
    const data = await insertRow("responsaveis_tecnicos", r);
    if (data) { await load(); toast.success("Responsável Técnico cadastrado!"); }
    return data;
  };

  const update = async (id: string, r: Partial<ResponsavelTecnico>) => {
    const ok = await updateRow("responsaveis_tecnicos", id, r);
    if (ok) { await load(); toast.success("Responsável Técnico atualizado!"); }
    return ok;
  };

  const remove = async (id: string) => {
    const ok = await deleteRow("responsaveis_tecnicos", id);
    if (ok) { await load(); toast.success("Responsável Técnico removido!"); }
    return ok;
  };

  const uploadCarteira = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("responsaveis-tecnicos").upload(path, file);
    if (error) { toast.error("Erro ao enviar carteira do CREA."); return null; }
    const { data } = supabase.storage.from("responsaveis-tecnicos").getPublicUrl(path);
    return { url: data.publicUrl, nome: file.name };
  };

  return (
    <ResponsaveisTecnicosContext.Provider value={{ responsaveis, loading, add, update, remove, uploadCarteira, refresh: load }}>
      {children}
    </ResponsaveisTecnicosContext.Provider>
  );
}
