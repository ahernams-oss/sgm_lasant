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
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  chavePix: string;
  whatsappCompras: string;
  whatsappRh: string;
  whatsappEngenharia: string;
  whatsappComercial: string;
  whatsappFaturamento: string;
  certificadoA1Url: string;
  certificadoA1Nome: string;
  certificadoA1Validade: string;
  certificadoA1Senha: string;
  nfeAmbiente: "homologacao" | "producao" | "";
  nfeUfAutor: string;
  certificadoA1Cnpj: string;
  certificadoA1Titular: string;
  certificadoA1Emissor: string;
  certificadoA1ValidadoEm: string;
  certificadoA1Status: string;
}

const EMPTY: Empresa = {
  id: "", razaoSocial: "", nomeFantasia: "", cnpj: "", inscricaoEstadual: "",
  inscricaoMunicipal: "", logradouro: "", numero: "", complemento: "", bairro: "",
  cidade: "", uf: "", cep: "", telefone: "", celular: "", email: "", emailCompras: "",
  contato: "", site: "", logoUrl: "", emailRh: "", emailEngenharia: "",
  emailEstoque: "", emailRelatorios: "", banco: "", agencia: "", conta: "",
  tipoConta: "", chavePix: "",
  whatsappCompras: "", whatsappRh: "", whatsappEngenharia: "",
  whatsappComercial: "", whatsappFaturamento: "",
  certificadoA1Url: "", certificadoA1Nome: "", certificadoA1Validade: "",
  certificadoA1Senha: "", nfeAmbiente: "homologacao", nfeUfAutor: "",
  certificadoA1Cnpj: "", certificadoA1Titular: "", certificadoA1Emissor: "",
  certificadoA1ValidadoEm: "", certificadoA1Status: "",
};

interface EmpresaContextType {
  empresa: Empresa;
  loading: boolean;
  saveEmpresa: (data: Empresa) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  uploadCertificadoA1: (file: File) => Promise<{ url: string; nome: string }>;
  removerCertificadoA1: () => Promise<void>;
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
  banco: r.banco ?? "",
  agencia: r.agencia ?? "",
  conta: r.conta ?? "",
  tipoConta: r.tipo_conta ?? "",
  chavePix: r.chave_pix ?? "",
  whatsappCompras: r.whatsapp_compras ?? "",
  whatsappRh: r.whatsapp_rh ?? "",
  whatsappEngenharia: r.whatsapp_engenharia ?? "",
  whatsappComercial: r.whatsapp_comercial ?? "",
  whatsappFaturamento: r.whatsapp_faturamento ?? "",
  certificadoA1Url: r.certificado_a1_url ?? "",
  certificadoA1Nome: r.certificado_a1_nome ?? "",
  certificadoA1Validade: r.certificado_a1_validade ?? "",
  certificadoA1Senha: "",
  nfeAmbiente: (r.nfe_ambiente ?? "homologacao") as Empresa["nfeAmbiente"],
  nfeUfAutor: r.nfe_uf_autor ?? "",
  certificadoA1Cnpj: r.certificado_a1_cnpj ?? "",
  certificadoA1Titular: r.certificado_a1_titular ?? "",
  certificadoA1Emissor: r.certificado_a1_emissor ?? "",
  certificadoA1ValidadoEm: r.certificado_a1_validado_em ?? "",
  certificadoA1Status: r.certificado_a1_status ?? "",
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
  banco: e.banco,
  agencia: e.agencia,
  conta: e.conta,
  tipo_conta: e.tipoConta,
  chave_pix: e.chavePix,
  whatsapp_compras: e.whatsappCompras,
  whatsapp_rh: e.whatsappRh,
  whatsapp_engenharia: e.whatsappEngenharia,
  whatsapp_comercial: e.whatsappComercial,
  whatsapp_faturamento: e.whatsappFaturamento,
  certificado_a1_url: e.certificadoA1Url,
  certificado_a1_nome: e.certificadoA1Nome,
  certificado_a1_validade: e.certificadoA1Validade || null,
  nfe_ambiente: e.nfeAmbiente || "homologacao",
  nfe_uf_autor: e.nfeUfAutor,
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

  const uploadCertificadoA1 = async (file: File): Promise<{ url: string; nome: string }> => {
    const fileName = `certificado_${Date.now()}.pfx`;
    const { error } = await supabase.storage
      .from("certificados-digitais")
      .upload(fileName, file, { upsert: true, contentType: "application/x-pkcs12" });
    if (error) throw error;
    return { url: fileName, nome: file.name };
  };

  const removerCertificadoA1 = async () => {
    if (empresa.certificadoA1Url) {
      await supabase.storage.from("certificados-digitais").remove([empresa.certificadoA1Url]);
    }
  };

  return (
    <EmpresaContext.Provider value={{ empresa, loading, saveEmpresa, uploadLogo, uploadCertificadoA1, removerCertificadoA1 }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider");
  return ctx;
}
