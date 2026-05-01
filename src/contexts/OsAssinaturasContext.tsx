import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";

export type PapelOsAssinatura = "fiscal" | "solicitante";

export interface OsAssinatura {
  id: string;
  os_id: string;
  os_numero: number;
  papel: PapelOsAssinatura;
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
  assinaturas: OsAssinatura[];
  porOs: (osId: string) => OsAssinatura[];
  registrar: (a: Partial<OsAssinatura>) => Promise<OsAssinatura | null>;
  buscarPorCodigo: (codigo: string) => Promise<OsAssinatura | null>;
  refresh: () => Promise<void>;
}

const OsAssinaturasContext = createContext<Ctx>({} as Ctx);
export const useOsAssinaturas = () => useContext(OsAssinaturasContext);

export function OsAssinaturasProvider({ children }: { children: ReactNode }) {
  const [assinaturas, setAssinaturas] = useState<OsAssinatura[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("os_assinaturas", "signed_at");
    setAssinaturas(data as OsAssinatura[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const registrar = async (a: Partial<OsAssinatura>) => {
    const data = await insertRow("os_assinaturas", a);
    if (data) await load();
    return data as OsAssinatura | null;
  };

  const porOs = (osId: string) => assinaturas.filter((a) => a.os_id === osId);

  const buscarPorCodigo = async (codigo: string): Promise<OsAssinatura | null> => {
    const { data, error } = await supabase
      .from("os_assinaturas")
      .select("*")
      .eq("codigo_verificador", codigo)
      .maybeSingle();
    if (error || !data) return null;
    return data as OsAssinatura;
  };

  return (
    <OsAssinaturasContext.Provider
      value={{ assinaturas, porOs, registrar, buscarPorCodigo, refresh: load }}
    >
      {children}
    </OsAssinaturasContext.Provider>
  );
}
