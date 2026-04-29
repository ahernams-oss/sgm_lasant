import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";

export interface RdoAssinatura {
  id: string;
  rdo_id: string;
  rdo_numero: number;
  papel: "responsavel" | "fiscalizacao";
  signatario_user_id: string;
  signatario_nome: string;
  signatario_email: string;
  signatario_cargo: string;
  signatario_matricula: string;
  hash_documento: string;
  codigo_verificador: string;
  ip_origem: string;
  user_agent: string;
  base_legal: string;
  signed_at: string;
  created_at: string;
}

interface Ctx {
  assinaturas: RdoAssinatura[];
  porRdo: (rdoId: string) => RdoAssinatura[];
  registrar: (a: Partial<RdoAssinatura>) => Promise<RdoAssinatura | null>;
  buscarPorCodigo: (codigo: string) => Promise<RdoAssinatura | null>;
  refresh: () => Promise<void>;
}

const RdoAssinaturasContext = createContext<Ctx>({} as Ctx);
export const useRdoAssinaturas = () => useContext(RdoAssinaturasContext);

export function RdoAssinaturasProvider({ children }: { children: ReactNode }) {
  const [assinaturas, setAssinaturas] = useState<RdoAssinatura[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("rdo_assinaturas", "signed_at");
    setAssinaturas(data as RdoAssinatura[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const registrar = async (a: Partial<RdoAssinatura>) => {
    const data = await insertRow("rdo_assinaturas", a);
    if (data) await load();
    return data as RdoAssinatura | null;
  };

  const porRdo = (rdoId: string) => assinaturas.filter(a => a.rdo_id === rdoId);

  const buscarPorCodigo = async (codigo: string): Promise<RdoAssinatura | null> => {
    const { data, error } = await supabase
      .from("rdo_assinaturas")
      .select("*")
      .eq("codigo_verificador", codigo)
      .maybeSingle();
    if (error || !data) return null;
    return data as RdoAssinatura;
  };

  return (
    <RdoAssinaturasContext.Provider value={{ assinaturas, porRdo, registrar, buscarPorCodigo, refresh: load }}>
      {children}
    </RdoAssinaturasContext.Provider>
  );
}
