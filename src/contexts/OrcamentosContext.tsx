import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface ItemScoOrcamento {
  id: string;
  codSco: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface ItemMaterialOrcamento {
  id: string;
  materialId: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Orcamento {
  id: string;
  numero: number;
  solicitacaoId: string;
  solicitacaoNumero: number;
  clienteId: string;
  clienteNome: string;
  itensSco: ItemScoOrcamento[];
  itensMateriais: ItemMaterialOrcamento[];
  anexos: string[];
  valorTotal: number;
  status: string;
  observacoes: string;
  revisaoMotivo: string;
  aprovadoPor: string;
  dataAprovacao: string;
  criadoPor: string;
  dataCriacao: string;
  createdAt: string;
}

interface OrcamentosContextType {
  orcamentos: Orcamento[];
  addOrcamento: (d: any) => Promise<any>;
  updateOrcamento: (id: string, d: any) => Promise<void>;
  deleteOrcamento: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const OrcamentosContext = createContext<OrcamentosContextType | undefined>(undefined);

const rowToOrcamento = (r: any): Orcamento => ({
  id: r.id,
  numero: r.numero ?? 0,
  solicitacaoId: r.solicitacao_id ?? "",
  solicitacaoNumero: r.solicitacao_numero ?? 0,
  clienteId: r.cliente_id ?? "",
  clienteNome: r.cliente_nome ?? "",
  itensSco: Array.isArray(r.itens_sco) ? r.itens_sco : [],
  itensMateriais: Array.isArray(r.itens_materiais) ? r.itens_materiais : [],
  anexos: Array.isArray(r.anexos) ? r.anexos : [],
  valorTotal: Number(r.valor_total) || 0,
  status: r.status ?? "Pendente",
  observacoes: r.observacoes ?? "",
  revisaoMotivo: r.revisao_motivo ?? "",
  aprovadoPor: r.aprovado_por ?? "",
  dataAprovacao: r.data_aprovacao ?? "",
  createdAt: r.created_at ?? "",
});

export function OrcamentosProvider({ children }: { children: ReactNode }) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("orcamentos", "numero");
    setOrcamentos(data.map(rowToOrcamento));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addOrcamento = async (d: any) => {
    const result = await insertRow("orcamentos", d);
    await load();
    return result;
  };
  const updateOrcamento = async (id: string, d: any) => { await updateRow("orcamentos", id, d); await load(); };
  const deleteOrcamento = async (id: string) => { await deleteRow("orcamentos", id); await load(); };

  return (
    <OrcamentosContext.Provider value={{ orcamentos, addOrcamento, updateOrcamento, deleteOrcamento, reload: load }}>
      {children}
    </OrcamentosContext.Provider>
  );
}

export function useOrcamentos() {
  const ctx = useContext(OrcamentosContext);
  if (!ctx) throw new Error("useOrcamentos must be used within OrcamentosProvider");
  return ctx;
}
