import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { fetchAll, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";

export type NfseStatus = "rascunho" | "processando" | "emitida" | "rejeitada" | "cancelada";

export interface NfseEmitida {
  id: string;
  empresa_id: string | null;
  ambiente: number;
  serie: string;
  numero_dps: number;
  status: NfseStatus;
  chave_acesso: string | null;
  protocolo: string | null;
  data_emissao: string | null;
  data_competencia: string | null;
  cliente_id: string | null;
  faturamento_id: string | null;
  prestador: any;
  tomador: any;
  servico: any;
  tributos: any;
  valor_servico: number;
  valor_iss: number;
  valor_liquido: number;
  xml_dps: string | null;
  xml_nfse: string | null;
  url_danfse: string | null;
  mensagem_retorno: string | null;
  motivo_cancelamento: string | null;
  data_cancelamento: string | null;
  created_at: string;
}

export interface NfseConfig {
  id?: string;
  empresa_id: string;
  ambiente: number;
  serie_padrao: string;
  proximo_numero_dps: number;
  regime_tributario: string | null;
  optante_simples: boolean;
  incentivador_cultural: boolean;
  codigo_municipio_prestador: string | null;
  codigo_servico_padrao: string | null;
  codigo_tributacao_municipio: string | null;
  codigo_nbs: string | null;
  cnae_padrao: string | null;
  aliquota_iss_padrao: number | null;
  iss_retido_padrao: boolean;
  natureza_operacao: string | null;
}

export interface ModeloEmissaoNfse {
  empresaId: string;
  ambiente?: 1 | 2;
  serie?: string;
  dataCompetencia?: string;
  clienteId?: string | null;
  faturamentoId?: string | null;
  prestador: any;
  tomador: any;
  servico: any;
  tributos: any;
  certificadoSenha: string;
}

interface Ctx {
  nfses: NfseEmitida[];
  config: NfseConfig | null;
  loading: boolean;
  reload: () => Promise<void>;
  saveConfig: (c: Partial<NfseConfig> & { empresa_id: string }) => Promise<void>;
  emitir: (modelo: ModeloEmissaoNfse) => Promise<{ ok: boolean; id?: string; mensagem?: string }>;
  cancelar: (id: string, motivo: string) => Promise<void>;
  remover: (id: string) => Promise<void>;
}

const NfsesContext = createContext<Ctx | undefined>(undefined);

export function NfsesProvider({ children }: { children: ReactNode }) {
  const [nfses, setNfses] = useState<NfseEmitida[]>([]);
  const [config, setConfig] = useState<NfseConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [list, cfgs] = await Promise.all([
      fetchAll("nfses_emitidas", "created_at"),
      fetchAll("nfse_config", "created_at"),
    ]);
    (list as any[]).reverse();
    setNfses(list as any);
    setConfig((cfgs?.[0] as any) || null);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const saveConfig = async (c: Partial<NfseConfig> & { empresa_id: string }) => {
    if (config?.id) {
      await updateRow("nfse_config", config.id, c as any);
    } else {
      await (supabase as any).from("nfse_config").insert(c);
    }
    await reload();
  };

  const emitir = async (modelo: ModeloEmissaoNfse) => {
    const { data, error } = await supabase.functions.invoke("nfse-emitir", { body: modelo });
    if (error) {
      await reload();
      return { ok: false, mensagem: error.message };
    }
    await reload();
    return { ok: !!data?.ok, id: data?.id, mensagem: data?.mensagem || data?.error };
  };

  const cancelar = async (id: string, motivo: string) => {
    await updateRow("nfses_emitidas", id, {
      status: "cancelada", motivo_cancelamento: motivo, data_cancelamento: new Date().toISOString(),
    });
    await reload();
  };

  const remover = async (id: string) => {
    await deleteRow("nfses_emitidas", id);
    await reload();
  };

  return (
    <NfsesContext.Provider value={{ nfses, config, loading, reload, saveConfig, emitir, cancelar, remover }}>
      {children}
    </NfsesContext.Provider>
  );
}

export function useNfses() {
  const ctx = useContext(NfsesContext);
  if (!ctx) throw new Error("useNfses deve ser usado dentro de NfsesProvider");
  return ctx;
}
