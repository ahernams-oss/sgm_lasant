import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  celular: string;
  email: string;
  emailCompras: string;
  emailRh: string;
  emailEngenharia: string;
  emailEstoque: string;
  emailRelatorios: string;
  contato: string;
  site: string;
  logoUrl: string;
}

const EMPTY: Empresa = {
  id: "", razaoSocial: "", nomeFantasia: "", cnpj: "", inscricaoEstadual: "",
  inscricaoMunicipal: "", logradouro: "", numero: "", complemento: "", bairro: "",
  cidade: "", uf: "", cep: "", telefone: "", celular: "", email: "", emailCompras: "",
  contato: "", site: "", logoUrl: "", emailRh: "", emailEngenharia: "",
  emailEstoque: "", emailRelatorios: "",
};

interface EmpresaContextType {
  empresa: Empresa;
  loading: boolean;
  saveEmpresa: (data: Empresa) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

const rowToEmpresa = (r: any): Empresa => ({
  id: r.id,
  razaoSocial: r.razao_social ?? "",
  nomeFantasia: r.nome_fantasia ?? "",
  cnpj: r.cnpj ?? "",
  inscricaoEstadual: r.inscricao_estadual ?? "",
  inscricaoMunicipal: r.inscricao_municipal ?? "",
  logradouro: r.logradouro ?? "",
  numero: r.numero ?? "",
  complemento: r.complemento ?? "",
  bairro: r.bairro ?? "",
  cidade: r.cidade ?? "",
  uf: r.uf ?? "",
  cep: r.cep ?? "",
  telefone: r.telefone ?? "",
  celular: r.celular ?? "",
  email: r.email ?? "",
  emailCompras: r.email_compras ?? "",
  emailRh: r.email_rh ?? "",
  emailEngenharia: r.email_engenharia ?? "",
  emailEstoque: r.email_estoque ?? "",
  emailRelatorios: r.email_relatorios ?? "",
  contato: r.contato ?? "",
  site: r.site ?? "",
  logoUrl: r.logo_url ?? "",
});

const empresaToRow = (e: Empresa) => ({
  razao_social: e.razaoSocial,
  nome_fantasia: e.nomeFantasia,
  cnpj: e.cnpj,
  inscricao_estadual: e.inscricaoEstadual,
  inscricao_municipal: e.inscricaoMunicipal,
  logradouro: e.logradouro,
  numero: e.numero,
  complemento: e.complemento,
  bairro: e.bairro,
  cidade: e.cidade,
  uf: e.uf,
  cep: e.cep,
  telefone: e.telefone,
  celular: e.celular,
  email: e.email,
  email_compras: e.emailCompras,
  email_rh: e.emailRh,
  email_engenharia: e.emailEngenharia,
  email_estoque: e.emailEstoque,
  email_relatorios: e.emailRelatorios,
  contato: e.contato,
  site: e.site,
  logo_url: e.logoUrl,
});

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAll("empresa", "created_at");
    if (data.length > 0) {
      setEmpresa(rowToEmpresa(data[0]));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveEmpresa = async (data: Empresa) => {
    if (data.id) {
      await updateRow("empresa", data.id, empresaToRow(data));
    } else {
      await insertRow("empresa", empresaToRow(data));
    }
    await load();
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "png";
    const fileName = `logo_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("empresa-logo")
      .upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("empresa-logo").getPublicUrl(fileName);
    return pub.publicUrl;
  };

  return (
    <EmpresaContext.Provider value={{ empresa, loading, saveEmpresa, uploadLogo }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider");
  return ctx;
}
