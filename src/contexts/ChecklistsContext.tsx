import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { toast } from "sonner";

export interface ChecklistItem {
  descricao: string;
  quantidade: string;
  registro_fotografico: boolean;
}

export interface Checklist {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  itens: ChecklistItem[];
  created_at: string;
}

export interface PreenchimentoItem {
  descricao: string;
  quantidade: string;
  registro_fotografico: boolean;
  status: "Conforme" | "Não Conforme" | "N/A" | "";
  foto_url?: string;
}

export interface ChecklistPreenchimento {
  id: string;
  checklist_id: string;
  checklist_titulo: string;
  evidencia_id: string;
  evidencia_titulo: string;
  itens: PreenchimentoItem[];
  percentual_conformidade: number;
  responsavel: string;
  data_preenchimento: string;
  observacoes: string;
  status: string;
  created_at: string;
}

interface ChecklistsContextType {
  checklists: Checklist[];
  preenchimentos: ChecklistPreenchimento[];
  loading: boolean;
  addChecklist: (c: Partial<Checklist>) => Promise<Checklist | null>;
  updateChecklist: (id: string, c: Partial<Checklist>) => Promise<boolean>;
  deleteChecklist: (id: string) => Promise<boolean>;
  addPreenchimento: (p: Partial<ChecklistPreenchimento>) => Promise<ChecklistPreenchimento | null>;
  updatePreenchimento: (id: string, p: Partial<ChecklistPreenchimento>) => Promise<boolean>;
  deletePreenchimento: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ChecklistsContext = createContext<ChecklistsContextType>({} as ChecklistsContextType);

export const useChecklists = () => useContext(ChecklistsContext);

export function ChecklistsProvider({ children }: { children: ReactNode }) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [preenchimentos, setPreenchimentos] = useState<ChecklistPreenchimento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cl, pr] = await Promise.all([
      fetchAll("checklists"),
      fetchAll("checklist_preenchimentos"),
    ]);
    setChecklists(cl as Checklist[]);
    setPreenchimentos(pr as ChecklistPreenchimento[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addChecklist = async (c: Partial<Checklist>) => {
    const data = await insertRow("checklists", c);
    if (data) { await load(); toast.success("Checklist criado com sucesso!"); }
    return data;
  };

  const updateChecklist = async (id: string, c: Partial<Checklist>) => {
    const ok = await updateRow("checklists", id, c);
    if (ok) { await load(); toast.success("Checklist atualizado!"); }
    return ok;
  };

  const deleteChecklist = async (id: string) => {
    const ok = await deleteRow("checklists", id);
    if (ok) { await load(); toast.success("Checklist removido!"); }
    return ok;
  };

  const addPreenchimento = async (p: Partial<ChecklistPreenchimento>) => {
    const data = await insertRow("checklist_preenchimentos", p);
    if (data) { await load(); toast.success("Checklist preenchido com sucesso!"); }
    return data;
  };

  const updatePreenchimento = async (id: string, p: Partial<ChecklistPreenchimento>) => {
    const ok = await updateRow("checklist_preenchimentos", id, p);
    if (ok) { await load(); toast.success("Preenchimento atualizado!"); }
    return ok;
  };

  const deletePreenchimento = async (id: string) => {
    const ok = await deleteRow("checklist_preenchimentos", id);
    if (ok) { await load(); toast.success("Preenchimento removido!"); }
    return ok;
  };

  return (
    <ChecklistsContext.Provider value={{
      checklists, preenchimentos, loading,
      addChecklist, updateChecklist, deleteChecklist,
      addPreenchimento, updatePreenchimento, deletePreenchimento,
      refresh: load,
    }}>
      {children}
    </ChecklistsContext.Provider>
  );
}
