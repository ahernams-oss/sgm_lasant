import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type TipoTransporte = "Ônibus" | "Trem" | "Metrô" | "VLT" | "Barca" | "Catamarã";

export const tiposTransporte: TipoTransporte[] = ["Ônibus", "Trem", "Metrô", "VLT", "Barca", "Catamarã"];

export interface PassagemDiaria {
  id: string;
  tipoTransporte: TipoTransporte;
  itinerario: string;
  valorPassagem: string;
  quantidade: number;
  total: number;
}

export interface AnexoDependente {
  id: string;
  nome: string;
  base64: string;
  tipo: string;
}

export interface Dependente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  grauParentesco: string;
  anexos: AnexoDependente[];
}

export interface EpiItem {
  id: string;
  quantidade: number;
  descricao: string;
  ca: string;
  dataEntrega: string;
}

export const grausParentesco = [
  "Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(ã)", "Avô(ó)", "Neto(a)", "Enteado(a)", "Tutelado(a)", "Outro"
];

export interface Funcionario {
  id: string;
  // Dados pessoais
  nome: string;
  cpf: string;
  rg: string;
  orgaoEmissor: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  nacionalidade: string;
  naturalidade: string;
  nomeMae: string;
  nomePai: string;
  telefone: string;
  email: string;
  pcd: boolean;
  tipoPcd: string;
  // Endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  // Dados profissionais
  cargoId: string;
  clienteId: string;
  dataAdmissao: string;
  dataDemissao: string;
  tipoContrato: string;
  salario: string;
  jornadaTrabalho: string;
  ctps: string;
  serieCtps: string;
  pis: string;
  // Dados bancários
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  chavePix: string;
  // Documentos adicionais
  tituloEleitor: string;
  zonaEleitoral: string;
  secaoEleitoral: string;
  cnh: string;
  categoriaCnh: string;
  validadeCnh: string;
  certificadoReservista: string;
  // Uniforme
  tamanhoCamisa: string;
  tamanhoCalca: string;
  tamanhoCalcado: string;
  peso: string;
  altura: string;
  // Passagem
  passagens: PassagemDiaria[];
  // Dependentes
  dependentes: Dependente[];
  // EPIs
  epis: EpiItem[];
  // Observações
  observacoes: string;
  // Status
  status: "Ativo" | "Inativo" | "Afastado" | "Férias";
}

export const emptyFuncionarioForm: Omit<Funcionario, "id"> = {
  nome: "", cpf: "", rg: "", orgaoEmissor: "", dataNascimento: "", sexo: "",
  estadoCivil: "", nacionalidade: "Brasileira", naturalidade: "", nomeMae: "", nomePai: "",
  telefone: "+55 ", email: "", pcd: false, tipoPcd: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  cargoId: "", clienteId: "", dataAdmissao: "", dataDemissao: "", tipoContrato: "CLT",
  salario: "", jornadaTrabalho: "", ctps: "", serieCtps: "", pis: "",
  banco: "", agencia: "", conta: "", tipoConta: "Corrente", chavePix: "",
  tituloEleitor: "", zonaEleitoral: "", secaoEleitoral: "",
  cnh: "", categoriaCnh: "", validadeCnh: "", certificadoReservista: "",
  tamanhoCamisa: "", tamanhoCalca: "", tamanhoCalcado: "", peso: "", altura: "",
  passagens: [],
  dependentes: [],
  epis: [],
  observacoes: "", status: "Ativo",
};

interface FuncionariosContextType {
  funcionarios: Funcionario[];
  addFuncionario: (f: Omit<Funcionario, "id">) => void;
  updateFuncionario: (id: string, f: Partial<Omit<Funcionario, "id">>) => void;
  deleteFuncionario: (id: string) => void;
}

const FuncionariosContext = createContext<FuncionariosContextType | undefined>(undefined);

export function FuncionariosProvider({ children }: { children: ReactNode }) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => {
    const saved = localStorage.getItem("funcionarios");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("funcionarios", JSON.stringify(funcionarios)); }, [funcionarios]);

  const addFuncionario = (f: Omit<Funcionario, "id">) =>
    setFuncionarios((prev) => [...prev, { id: crypto.randomUUID(), ...f }]);

  const updateFuncionario = (id: string, data: Partial<Omit<Funcionario, "id">>) =>
    setFuncionarios((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));

  const deleteFuncionario = (id: string) =>
    setFuncionarios((prev) => prev.filter((f) => f.id !== id));

  return (
    <FuncionariosContext.Provider value={{ funcionarios, addFuncionario, updateFuncionario, deleteFuncionario }}>
      {children}
    </FuncionariosContext.Provider>
  );
}

export function useFuncionarios() {
  const ctx = useContext(FuncionariosContext);
  if (!ctx) throw new Error("useFuncionarios must be used within FuncionariosProvider");
  return ctx;
}
