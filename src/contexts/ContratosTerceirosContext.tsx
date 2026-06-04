import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { toast } from "sonner";

export interface ContratoAditivo {
  id: string;
  numero: string;
  data: string;
  tipo: "prazo" | "valor" | "prazo_valor";
  valor_adicional?: number;
  nova_data_fim?: string;
  descricao?: string;
}

export interface ContratoMedicaoVinc {
  medicao_id: string;
  numero?: number;
  data?: string;
  valor?: number;
}

export interface ContratoAnexo {
  nome: string;
  url: string;
  size?: number;
  tipo?: string;
}

export interface ContratoTerceiro {
  id: string;
  numero?: number;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  fornecedor_cnpj?: string | null;
  fornecedor_endereco?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  obra_id?: string | null;
  obra_nome?: string | null;
  objeto: string;
  valor?: number;
  data_inicio?: string | null;
  data_fim?: string | null;
  status: string;
  observacoes?: string | null;
  aditivos: ContratoAditivo[];
  medicoes_vinculadas: ContratoMedicaoVinc[];
  anexos: ContratoAnexo[];
  created_at?: string;
  updated_at?: string;
}

interface Ctx {
  contratos: ContratoTerceiro[];
  loading: boolean;
  add: (c: Partial<ContratoTerceiro>) => Promise<ContratoTerceiro | null>;
  update: (id: string, c: Partial<ContratoTerceiro>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ContratosTerceirosContext = createContext<Ctx>({
  contratos: [],
  loading: false,
  add: async () => null,
  update: async () => false,
  remove: async () => false,
  refresh: async () => {},
});

export const useContratosTerceiros = () => useContext(ContratosTerceirosContext);

export function ContratosTerceirosProvider({ children }: { children: ReactNode }) {
  const [contratos, setContratos] = useState<ContratoTerceiro[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAll("contratos_terceiros", "created_at");
    setContratos((data as ContratoTerceiro[]).sort((a, b) => (b.numero || 0) - (a.numero || 0)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (c: Partial<ContratoTerceiro>) => {
    const data = await insertRow("contratos_terceiros", c);
    if (data) { await load(); toast.success("Contrato cadastrado!"); }
    return data as ContratoTerceiro | null;
  };

  const update = async (id: string, c: Partial<ContratoTerceiro>) => {
    const ok = await updateRow("contratos_terceiros", id, c);
    if (ok) { await load(); toast.success("Contrato atualizado!"); }
    return ok;
  };

  const remove = async (id: string) => {
    const ok = await deleteRow("contratos_terceiros", id);
    if (ok) { await load(); toast.success("Contrato removido!"); }
    return ok;
  };

  return (
    <ContratosTerceirosContext.Provider value={{ contratos, loading, add, update, remove, refresh: load }}>
      {children}
    </ContratosTerceirosContext.Provider>
  );
}
