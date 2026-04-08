import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TipoTransporte = "Ônibus" | "Trem" | "Metrô" | "VLT" | "Barca" | "Catamarã";
export const tiposTransporte: TipoTransporte[] = ["Ônibus", "Trem", "Metrô", "VLT", "Barca", "Catamarã"];

export interface PassagemDiaria { id: string; tipoTransporte: TipoTransporte; itinerario: string; valorPassagem: string; quantidade: number; total: number; }
export interface AnexoDependente { id: string; nome: string; base64: string; tipo: string; }
export interface Dependente { id: string; nome: string; cpf: string; dataNascimento: string; grauParentesco: string; anexos: AnexoDependente[]; }
export interface NrFuncionario { id: string; numero: string; descricao: string; dataEntrega: string; anexoBase64?: string; anexoNome?: string; anexoTipo?: string; }
export interface EpiItem { id: string; quantidade: number; descricao: string; ca: string; dataEntrega: string; }
export interface AnexoDocumento { id: string; nome: string; path: string; tamanho: number; data: string; descricao: string; }

export const grausParentesco = ["Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(ã)", "Avô(ó)", "Neto(a)", "Enteado(a)", "Tutelado(a)", "Outro"];

export interface Funcionario {
  id: string; nome: string; cpf: string; rg: string; orgaoEmissor: string;
  dataNascimento: string; sexo: string; estadoCivil: string; nacionalidade: string;
  naturalidade: string; nomeMae: string; nomePai: string; telefone: string; email: string;
  pcd: boolean; tipoPcd: string; cep: string; logradouro: string; numero: string;
  complemento: string; bairro: string; cidade: string; uf: string;
  cargoId: string; clienteId: string; dataAdmissao: string; dataDemissao: string;
  tipoContrato: string; salario: string; jornadaTrabalho: string; ctps: string;
  serieCtps: string; pis: string; banco: string; agencia: string; conta: string;
  tipoConta: string; chavePix: string; tituloEleitor: string; zonaEleitoral: string;
  secaoEleitoral: string; cnh: string; categoriaCnh: string; validadeCnh: string;
  certificadoReservista: string; tamanhoCamisa: string; tamanhoCalca: string;
  tamanhoCalcado: string; peso: string; altura: string;
  passagens: PassagemDiaria[]; dependentes: Dependente[]; epis: EpiItem[];
  nrs: NrFuncionario[]; anexosDocumentos: AnexoDocumento[]; observacoes: string;
  status: "Ativo" | "Inativo" | "Afastado" | "Férias";
  experienciaInicio: string; experienciaPrimeiraEtapa: string;
  experienciaFim: string; experienciaRenovado: boolean;
  experienciaNotificado10dPrimeira: boolean; experienciaNotificado10dFinal: boolean;
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
  passagens: [], dependentes: [], epis: [], nrs: [], anexosDocumentos: [],
  observacoes: "", status: "Ativo",
  experienciaInicio: "", experienciaPrimeiraEtapa: "", experienciaFim: "",
  experienciaRenovado: false, experienciaNotificado10dPrimeira: false,
  experienciaNotificado10dFinal: false,
};

function rowToFuncionario(row: any): Funcionario {
  return {
    id: row.id, nome: row.nome ?? "", cpf: row.cpf ?? "", rg: row.rg ?? "",
    orgaoEmissor: row.orgao_emissor ?? "", dataNascimento: row.data_nascimento ?? "",
    sexo: row.sexo ?? "", estadoCivil: row.estado_civil ?? "",
    nacionalidade: row.nacionalidade ?? "Brasileira", naturalidade: row.naturalidade ?? "",
    nomeMae: row.nome_mae ?? "", nomePai: row.nome_pai ?? "",
    telefone: row.telefone ?? "+55 ", email: row.email ?? "",
    pcd: row.pcd ?? false, tipoPcd: row.tipo_pcd ?? "",
    cep: row.cep ?? "", logradouro: row.logradouro ?? "", numero: row.numero ?? "",
    complemento: row.complemento ?? "", bairro: row.bairro ?? "",
    cidade: row.cidade ?? "", uf: row.uf ?? "",
    cargoId: row.cargo_id ?? "", clienteId: row.cliente_id ?? "",
    dataAdmissao: row.data_admissao ?? "", dataDemissao: row.data_demissao ?? "",
    tipoContrato: row.tipo_contrato ?? "CLT", salario: row.salario ?? "",
    jornadaTrabalho: row.jornada_trabalho ?? "", ctps: row.ctps ?? "",
    serieCtps: row.serie_ctps ?? "", pis: row.pis ?? "",
    banco: row.banco ?? "", agencia: row.agencia ?? "", conta: row.conta ?? "",
    tipoConta: row.tipo_conta ?? "Corrente", chavePix: row.chave_pix ?? "",
    tituloEleitor: row.titulo_eleitor ?? "", zonaEleitoral: row.zona_eleitoral ?? "",
    secaoEleitoral: row.secao_eleitoral ?? "", cnh: row.cnh ?? "",
    categoriaCnh: row.categoria_cnh ?? "", validadeCnh: row.validade_cnh ?? "",
    certificadoReservista: row.certificado_reservista ?? "",
    tamanhoCamisa: row.tamanho_camisa ?? "", tamanhoCalca: row.tamanho_calca ?? "",
    tamanhoCalcado: row.tamanho_calcado ?? "", peso: row.peso ?? "", altura: row.altura ?? "",
    passagens: row.passagens ?? [], dependentes: row.dependentes ?? [],
    epis: row.epis ?? [], nrs: row.nrs ?? [], anexosDocumentos: row.anexos_documentos ?? [],
    observacoes: row.observacoes ?? "", status: row.status ?? "Ativo",
    experienciaInicio: row.experiencia_inicio ?? "",
    experienciaPrimeiraEtapa: row.experiencia_primeira_etapa ?? "",
    experienciaFim: row.experiencia_fim ?? "",
    experienciaRenovado: row.experiencia_renovado ?? false,
    experienciaNotificado10dPrimeira: row.experiencia_notificado_10d_primeira ?? false,
    experienciaNotificado10dFinal: row.experiencia_notificado_10d_final ?? false,
  };
}

function funcionarioToRow(f: Omit<Funcionario, "id">) {
  return {
    nome: f.nome, cpf: f.cpf, rg: f.rg, orgao_emissor: f.orgaoEmissor,
    data_nascimento: f.dataNascimento, sexo: f.sexo, estado_civil: f.estadoCivil,
    nacionalidade: f.nacionalidade, naturalidade: f.naturalidade,
    nome_mae: f.nomeMae, nome_pai: f.nomePai, telefone: f.telefone, email: f.email,
    pcd: f.pcd, tipo_pcd: f.tipoPcd, cep: f.cep, logradouro: f.logradouro,
    numero: f.numero, complemento: f.complemento, bairro: f.bairro,
    cidade: f.cidade, uf: f.uf, cargo_id: f.cargoId, cliente_id: f.clienteId,
    data_admissao: f.dataAdmissao, data_demissao: f.dataDemissao,
    tipo_contrato: f.tipoContrato, salario: f.salario,
    jornada_trabalho: f.jornadaTrabalho, ctps: f.ctps, serie_ctps: f.serieCtps,
    pis: f.pis, banco: f.banco, agencia: f.agencia, conta: f.conta,
    tipo_conta: f.tipoConta, chave_pix: f.chavePix,
    titulo_eleitor: f.tituloEleitor, zona_eleitoral: f.zonaEleitoral,
    secao_eleitoral: f.secaoEleitoral, cnh: f.cnh, categoria_cnh: f.categoriaCnh,
    validade_cnh: f.validadeCnh, certificado_reservista: f.certificadoReservista,
    tamanho_camisa: f.tamanhoCamisa, tamanho_calca: f.tamanhoCalca,
    tamanho_calcado: f.tamanhoCalcado, peso: f.peso, altura: f.altura,
    passagens: f.passagens as any, dependentes: f.dependentes as any,
    epis: f.epis as any, nrs: f.nrs as any,
    observacoes: f.observacoes, status: f.status,
    experiencia_inicio: f.experienciaInicio || null,
    experiencia_primeira_etapa: f.experienciaPrimeiraEtapa || null,
    experiencia_fim: f.experienciaFim || null,
    experiencia_renovado: f.experienciaRenovado,
    experiencia_notificado_10d_primeira: f.experienciaNotificado10dPrimeira,
    experiencia_notificado_10d_final: f.experienciaNotificado10dFinal,
  };
}

interface FuncionariosContextType {
  funcionarios: Funcionario[];
  addFuncionario: (f: Omit<Funcionario, "id">) => void;
  updateFuncionario: (id: string, f: Partial<Omit<Funcionario, "id">>) => void;
  deleteFuncionario: (id: string) => void;
}


const FuncionariosContext = createContext<FuncionariosContextType | undefined>(undefined);

export function FuncionariosProvider({ children }: { children: ReactNode }) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  const fetchFuncionarios = useCallback(async () => {
    const { data, error } = await (supabase as any).from("funcionarios").select("*").order("nome");
    if (error) { console.error("Erro:", error); toast.error("Erro ao carregar funcionários."); return; }
    setFuncionarios((data || []).map(rowToFuncionario));
  }, []);

  useEffect(() => { fetchFuncionarios(); }, [fetchFuncionarios]);

  const addFuncionario = async (f: Omit<Funcionario, "id">) => {
    const { error } = await (supabase as any).from("funcionarios").insert(funcionarioToRow(f));
    if (error) { console.error("Erro:", error); toast.error("Erro ao cadastrar."); return; }
    await fetchFuncionarios();
  };

  const updateFuncionario = async (id: string, data: Partial<Omit<Funcionario, "id">>) => {
    const fullData = { ...emptyFuncionarioForm, ...funcionarios.find(f => f.id === id), ...data };
    const { id: _id, ...rest } = fullData as Funcionario;
    const { error } = await (supabase as any).from("funcionarios").update(funcionarioToRow(rest)).eq("id", id);
    if (error) { console.error("Erro:", error); toast.error("Erro ao atualizar."); return; }
    await fetchFuncionarios();
  };

  const deleteFuncionario = async (id: string) => {
    const { error } = await (supabase as any).from("funcionarios").delete().eq("id", id);
    if (error) { console.error("Erro:", error); toast.error("Erro ao remover."); return; }
    await fetchFuncionarios();
  };

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
