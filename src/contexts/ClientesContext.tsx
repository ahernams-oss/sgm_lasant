import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface InformacaoFinanceira {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
}

export interface Setor {
  id: string;
  descricao: string;
  ativo: boolean;
}

export interface Pavimento {
  id: string;
  descricao: string;
  ativo: boolean;
  setores: Setor[];
}

export interface LocalCliente {
  id: string;
  descricao: string;
  cep: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  uf: string;
  cidade: string;
  latitude: string;
  longitude: string;
  areaTotal: string;
  areaConstruida: string;
  contato: string;
  telContato: string;
  relLinha1: string;
  relLinha2: string;
  relLinha3: string;
  relLinha4: string;
  pavimentos: Pavimento[];
}

export interface LocalEntrega {
  id: string;
  local: string;
  cep: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  uf: string;
  cidade: string;
  contato: string;
  telContato: string;
  relLinha1: string;
  relLinha2: string;
  relLinha3: string;
  relLinha4: string;
}

export interface Cliente {
  id: string;
  tipo: "Cliente" | "Fornecedor";
  nome: string; // Nome Empresa / Razão Social
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  esfera: string;
  descricao: string;
  // E-mails
  email: string;
  emailEngenharia: string;
  emailOsCc: string;
  emailOsBcc: string;
  emailSsCc: string;
  emailSsBcc: string;
  emailCompras: string;
  // Telefones
  telefones: string[];
  telefoneCelular: string;
  celulares: string;
  telefonesWhatsapp: string;
  // Endereço
  cep: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  uf: string;
  cidade: string;
  endereco: string; // legacy compat
  // Contrato
  dataInicioContrato: string;
  // Impressão
  relLinha1: string;
  relLinha2: string;
  relLinha3: string;
  relLinha4: string;
  // Contato
  contato: string;
  grupoWhatsapp: string;
  // Sub-entidades
  informacoesFinanceiras: InformacaoFinanceira[];
  locais: LocalCliente[];
  locaisEntrega: LocalEntrega[];
}

interface ClientesContextType {
  clientes: Cliente[];
  addCliente: (cliente: Omit<Cliente, "id">) => void;
  updateCliente: (id: string, cliente: Partial<Omit<Cliente, "id">>) => void;
  deleteCliente: (id: string) => void;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

const migrateCliente = (c: any): Cliente => ({
  id: c.id,
  tipo: c.tipo || "Cliente",
  nome: c.nome || c.nome_empresa || "",
  nomeFantasia: c.nomeFantasia || "",
  cnpj: c.cnpj || "",
  inscricaoEstadual: c.inscricaoEstadual || "",
  inscricaoMunicipal: c.inscricaoMunicipal || "",
  esfera: c.esfera || "",
  descricao: c.descricao || "",
  email: c.email || "",
  emailEngenharia: c.emailEngenharia || "",
  emailOsCc: c.emailOsCc || "",
  emailOsBcc: c.emailOsBcc || "",
  emailSsCc: c.emailSsCc || "",
  emailSsBcc: c.emailSsBcc || "",
  emailCompras: c.emailCompras || "",
  telefones: Array.isArray(c.telefones) ? c.telefones : c.telefone ? [c.telefone] : [],
  telefoneCelular: c.telefoneCelular || "",
  celulares: c.celulares || "",
  telefonesWhatsapp: c.telefonesWhatsapp || "",
  cep: c.cep || "",
  bairro: c.bairro || "",
  logradouro: c.logradouro || "",
  numero: c.numero || "",
  complemento: c.complemento || "",
  uf: c.uf || "",
  cidade: c.cidade || "",
  endereco: c.endereco || "",
  dataInicioContrato: c.dataInicioContrato || "",
  relLinha1: c.relLinha1 || "",
  relLinha2: c.relLinha2 || "",
  relLinha3: c.relLinha3 || "",
  relLinha4: c.relLinha4 || "",
  contato: c.contato || "",
  grupoWhatsapp: c.grupoWhatsapp || "",
  informacoesFinanceiras: c.informacoesFinanceiras || [],
  locais: (c.locais || []).map((l: any) => ({ ...l, pavimentos: l.pavimentos || [] })),
  locaisEntrega: c.locaisEntrega || [],
});

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem("clientes");
    if (!saved) return [];
    return JSON.parse(saved).map(migrateCliente);
  });

  useEffect(() => { localStorage.setItem("clientes", JSON.stringify(clientes)); }, [clientes]);

  const addCliente = (cliente: Omit<Cliente, "id">) =>
    setClientes((prev) => [...prev, { id: crypto.randomUUID(), ...cliente } as Cliente]);

  const updateCliente = (id: string, data: Partial<Omit<Cliente, "id">>) =>
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

  const deleteCliente = (id: string) =>
    setClientes((prev) => prev.filter((c) => c.id !== id));

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
