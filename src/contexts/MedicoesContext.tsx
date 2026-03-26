import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface ItemServico {
  id: string;
  descricao: string;
  unidade: string;
  quantidade_contratada: number;
  valor_unitario: number;
  valor_total_contratado: number;
}

export interface LancamentoMedicao {
  id: string;
  numero: number;
  data: string;
  tipo: "percentual" | "valor";
  itens: {
    item_id: string;
    descricao: string;
    percentual?: number;
    valor?: number;
    quantidade?: number;
  }[];
  valor_total: number;
  percentual_total: number;
  status: string;
  observacao: string;
}

export interface MedicaoServico {
  id: string;
  created_at?: string;
  numero: number;
  cliente_id: string;
  cliente_nome: string;
  contrato: string;
  descricao: string;
  status: string;
  valor_total_contratado: number;
  valor_total_medido: number;
  percentual_medido: number;
  itens: ItemServico[];
  medicoes: LancamentoMedicao[];
  observacoes: string;
}

interface MedicoesContextType {
  medicoes: MedicaoServico[];
  loading: boolean;
  addMedicao: (m: Omit<MedicaoServico, "id">) => Promise<void>;
  updateMedicao: (id: string, m: Partial<MedicaoServico>) => Promise<void>;
  deleteMedicao: (id: string) => Promise<void>;
}

const MedicoesContext = createContext<MedicoesContextType | undefined>(undefined);

export function MedicoesProvider({ children }: { children: ReactNode }) {
  const [medicoes, setMedicoes] = useState<MedicaoServico[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchAll("medicoes_servicos");
    setMedicoes(
      (data || []).map((d: any) => ({
        ...d,
        itens: Array.isArray(d.itens) ? d.itens : [],
        medicoes: Array.isArray(d.medicoes) ? d.medicoes : [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addMedicao = async (m: Omit<MedicaoServico, "id">) => {
    await insertRow("medicoes_servicos", m);
    await load();
  };

  const updateMedicao = async (id: string, m: Partial<MedicaoServico>) => {
    await updateRow("medicoes_servicos", id, m);
    await load();
  };

  const deleteMedicao = async (id: string) => {
    await deleteRow("medicoes_servicos", id);
    await load();
  };

  return (
    <MedicoesContext.Provider value={{ medicoes, loading, addMedicao, updateMedicao, deleteMedicao }}>
      {children}
    </MedicoesContext.Provider>
  );
}

export function useMedicoes() {
  const ctx = useContext(MedicoesContext);
  if (!ctx) throw new Error("useMedicoes deve ser usado dentro de MedicoesProvider");
  return ctx;
}
