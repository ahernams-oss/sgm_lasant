import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface InformacaoFinanceira { id: string; banco: string; agencia: string; conta: string; chavePix: string; }
export interface Setor { id: string; descricao: string; ativo: boolean; }
export interface Pavimento { id: string; descricao: string; ativo: boolean; setores: Setor[]; }
export interface LocalCliente {
  id: string; descricao: string; cep: string; bairro: string; logradouro: string;
  numero: string; complemento: string; uf: string; cidade: string;
  latitude: string; longitude: string; areaTotal: string; areaConstruida: string;
  contato: string; telContato: string;
  relLinha1: string; relLinha2: string; relLinha3: string; relLinha4: string;
  pavimentos: Pavimento[];
}
export interface LocalEntrega {
  id: string; local: string; cep: string; bairro: string; logradouro: string;
  numero: string; complemento: string; uf: string; cidade: string;
  contato: string; telContato: string;
  relLinha1: string; relLinha2: string; relLinha3: string; relLinha4: string;
}
export interface Faturamento {
  id: string;
  periodoInicio: string;
  periodoFim: string;
  dataEmissaoNf: string;
  xmlNfNome: string;
  xmlNfConteudo: string;
  numeroMedicao: string;
  descricao: string;
  valorBruto: string;
  valorLiquido: string;
  valorFolha: string;
  anexoNfUrl: string;
  anexoNfNome: string;
  pago: boolean;
  dataPagamento: string;
}
export interface Contrato {
  id: string; numero: string; descricao: string; dataInicio: string; dataFim: string;
  bdi: string; valorBase: string; valorBase2: string; valorBase3: string;
  mesSco: string; anoSco: string;
  faturamentos: Faturamento[];
}
export interface Cliente {
  id: string; tipo: "Cliente" | "Fornecedor"; nome: string; nomeFantasia: string;
  cnpj: string; inscricaoEstadual: string; inscricaoMunicipal: string; esfera: string; descricao: string; cap: string;
  email: string; emailEngenharia: string; emailOsCc: string; emailOsBcc: string;
  emailSsCc: string; emailSsBcc: string; emailCompras: string;
  telefones: string[]; telefoneCelular: string; celulares: string; telefonesWhatsapp: string;
  cep: string; bairro: string; logradouro: string; numero: string; complemento: string;
  uf: string; cidade: string; endereco: string;
  dataInicioContrato: string;
  relLinha1: string; relLinha2: string; relLinha3: string; relLinha4: string;
  contato: string; grupoWhatsapp: string;
  logoUrl: string;
  informacoesFinanceiras: InformacaoFinanceira[];
  locais: LocalCliente[];
  locaisEntrega: LocalEntrega[];
  contratos: Contrato[];
}

interface ClientesContextType {
  clientes: Cliente[]; addCliente: (c: Omit<Cliente, "id">) => void;
  updateCliente: (id: string, c: Partial<Omit<Cliente, "id">>) => void;
  deleteCliente: (id: string) => void;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

const rowToCliente = (r: any): Cliente => ({
  id: r.id, tipo: r.tipo || "Cliente", nome: r.nome ?? "", nomeFantasia: r.nome_fantasia ?? "",
  cnpj: r.cnpj ?? "", inscricaoEstadual: r.inscricao_estadual ?? "",
  inscricaoMunicipal: r.inscricao_municipal ?? "", esfera: r.esfera ?? "", descricao: r.descricao ?? "", cap: r.cap ?? "",
  email: r.email ?? "", emailEngenharia: r.email_engenharia ?? "",
  emailOsCc: r.email_os_cc ?? "", emailOsBcc: r.email_os_bcc ?? "",
  emailSsCc: r.email_ss_cc ?? "", emailSsBcc: r.email_ss_bcc ?? "", emailCompras: r.email_compras ?? "",
  telefones: r.telefones ?? [], telefoneCelular: r.telefone_celular ?? "",
  celulares: r.celulares ?? "", telefonesWhatsapp: r.telefones_whatsapp ?? "",
  cep: r.cep ?? "", bairro: r.bairro ?? "", logradouro: r.logradouro ?? "",
  numero: r.numero ?? "", complemento: r.complemento ?? "", uf: r.uf ?? "", cidade: r.cidade ?? "",
  endereco: r.endereco ?? "", dataInicioContrato: r.data_inicio_contrato ?? "",
  relLinha1: r.rel_linha1 ?? "", relLinha2: r.rel_linha2 ?? "",
  relLinha3: r.rel_linha3 ?? "", relLinha4: r.rel_linha4 ?? "",
  contato: r.contato ?? "", grupoWhatsapp: r.grupo_whatsapp ?? "",
  logoUrl: r.logo_url ?? "",
  informacoesFinanceiras: r.informacoes_financeiras ?? [],
  locais: r.locais ?? [], locaisEntrega: r.locais_entrega ?? [], contratos: r.contratos ?? [],
});

const clienteToRow = (c: Omit<Cliente, "id">) => ({
  tipo: c.tipo, nome: c.nome, nome_fantasia: c.nomeFantasia,
  cnpj: c.cnpj, inscricao_estadual: c.inscricaoEstadual,
  inscricao_municipal: c.inscricaoMunicipal, esfera: c.esfera, descricao: c.descricao, cap: c.cap,
  email: c.email, email_engenharia: c.emailEngenharia,
  email_os_cc: c.emailOsCc, email_os_bcc: c.emailOsBcc,
  email_ss_cc: c.emailSsCc, email_ss_bcc: c.emailSsBcc, email_compras: c.emailCompras,
  telefones: c.telefones as any, telefone_celular: c.telefoneCelular,
  celulares: c.celulares, telefones_whatsapp: c.telefonesWhatsapp,
  cep: c.cep, bairro: c.bairro, logradouro: c.logradouro,
  numero: c.numero, complemento: c.complemento, uf: c.uf, cidade: c.cidade,
  endereco: c.endereco, data_inicio_contrato: c.dataInicioContrato,
  rel_linha1: c.relLinha1, rel_linha2: c.relLinha2, rel_linha3: c.relLinha3, rel_linha4: c.relLinha4,
  contato: c.contato, grupo_whatsapp: c.grupoWhatsapp,
  logo_url: c.logoUrl,
  informacoes_financeiras: c.informacoesFinanceiras as any,
  locais: c.locais as any, locais_entrega: c.locaisEntrega as any, contratos: c.contratos as any,
});

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("clientes", "nome");
    setClientes(data.map(rowToCliente));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCliente = async (c: Omit<Cliente, "id">) => {
    await insertRow("clientes", clienteToRow(c));
    await load();
  };

  const updateCliente = async (id: string, data: Partial<Omit<Cliente, "id">>) => {
    const current = clientes.find(c => c.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    const { id: _, ...rest } = merged;
    await updateRow("clientes", id, clienteToRow(rest));
    await load();
  };

  const deleteCliente = async (id: string) => {
    await deleteRow("clientes", id);
    await load();
  };

  return (
    <ClientesContext.Provider value={{ clientes, addCliente, updateCliente, deleteCliente }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error("useClientes must be used within ClientesProvider");
  return ctx;
}
