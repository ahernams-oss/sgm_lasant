import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { toast } from "sonner";

export interface Obra {
  id: string;
  numero?: number;
  cliente_id: string;
  cliente_nome: string;
  nome: string;
  descricao?: string;
  endereco?: string;
  responsavel?: string;
  data_inicio?: string | null;
  data_prevista_termino?: string | null;
  status?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

interface Ctx {
  obras: Obra[];
  loading: boolean;
  add: (o: Partial<Obra>) => Promise<Obra | null>;
  update: (id: string, o: Partial<Obra>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  porCliente: (clienteId: string) => Obra[];
  refresh: () => Promise<void>;
}

const ObrasContext = createContext<Ctx>({
  obras: [],
  loading: false,
  add: async () => null,
  update: async () => false,
  remove: async () => false,
  porCliente: () => [],
  refresh: async () => {},
});
export const useObras = () => useContext(ObrasContext);

export function ObrasProvider({ children }: { children: ReactNode }) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAll("obras", "nome");
    setObras(data as Obra[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (o: Partial<Obra>) => {
    const data = await insertRow("obras", o);
    if (data) { await load(); toast.success("Obra cadastrada!"); }
    return data as Obra | null;
  };

  const update = async (id: string, o: Partial<Obra>) => {
    const ok = await updateRow("obras", id, o);
    if (ok) { await load(); toast.success("Obra atualizada!"); }
    return ok;
  };

  const remove = async (id: string) => {
    const ok = await deleteRow("obras", id);
    if (ok) { await load(); toast.success("Obra removida!"); }
    return ok;
  };

  const porCliente = (clienteId: string) =>
    obras.filter((o) => o.cliente_id === clienteId);

  return (
    <ObrasContext.Provider value={{ obras, loading, add, update, remove, porCliente, refresh: load }}>
      {children}
    </ObrasContext.Provider>
  );
}
