import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow } from "@/lib/supabaseHelper";
import { enviarNotificacaoRP } from "@/lib/notificacaoRP";

export interface StatusHistorico { status: string; dataHora: string; usuario?: string; }

export interface Requisicao {
  id: string; numero: number; dataCriacao: string;
  headcount: string; orcamento: string; tipoVaga: string;
  unidade: string;
  cargoNome: string; cargoId: string; jornada: string; cargaHoraria: string;
  tipoContratacao: string[]; internoExterno: string; origemVaga: string;
  motivoOutros: string; matricula: string; nomeSubstituido: string;
  cargoSubstituido: string; salarioSubstituido: string; dataDesligamento: string;
  formacao: string[]; formacaoDetalhe: string; experiencia: string;
  conhecimentoInformatica: string; atividadesCargo: string; salarioVaga: string;
  solicitante?: string;
  status: "Pendente" | "Em Análise" | "Aprovada" | "Reprovada" | "Concluída";
  aprovadoPor?: string; historicoStatus: StatusHistorico[];
}

interface RequisicaoContextType {
  requisicoes: Requisicao[];
  addRequisicao: (req: Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "aprovadoPor" | "historicoStatus">) => void;
  updateRequisicao: (id: string, data: Partial<Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "aprovadoPor" | "historicoStatus">>) => void;
  updateStatus: (id: string, status: Requisicao["status"], aprovadoPor?: string) => void;
}

const RequisicaoContext = createContext<RequisicaoContextType | undefined>(undefined);

const rowToReq = (r: any): Requisicao => ({
  id: r.id, numero: r.numero ?? 0, dataCriacao: r.data_criacao ?? "",
  headcount: r.headcount ?? "", orcamento: r.orcamento ?? "", tipoVaga: r.tipo_vaga ?? "",
  unidade: r.unidade ?? "", cargoNome: r.cargo_nome ?? "", cargoId: r.cargo_id ?? "",
  jornada: r.jornada ?? "", cargaHoraria: r.carga_horaria ?? "",
  tipoContratacao: r.tipo_contratacao ?? [], internoExterno: r.interno_externo ?? "",
  origemVaga: r.origem_vaga ?? "", motivoOutros: r.motivo_outros ?? "",
  matricula: r.matricula ?? "", nomeSubstituido: r.nome_substituido ?? "",
  cargoSubstituido: r.cargo_substituido ?? "", salarioSubstituido: r.salario_substituido ?? "",
  dataDesligamento: r.data_desligamento ?? "", formacao: r.formacao ?? [],
  formacaoDetalhe: r.formacao_detalhe ?? "", experiencia: r.experiencia ?? "",
  conhecimentoInformatica: r.conhecimento_informatica ?? "",
  atividadesCargo: r.atividades_cargo ?? "", salarioVaga: r.salario_vaga ?? "",
  solicitante: r.solicitante ?? "",
  status: r.status ?? "Pendente", aprovadoPor: r.aprovado_por ?? "",
  historicoStatus: r.historico_status ?? [],
});

const reqToRow = (r: Requisicao) => ({
  numero: r.numero, data_criacao: r.dataCriacao,
  headcount: r.headcount, orcamento: r.orcamento, tipo_vaga: r.tipoVaga,
  unidade: r.unidade,
  cargo_nome: r.cargoNome, cargo_id: r.cargoId, jornada: r.jornada,
  carga_horaria: r.cargaHoraria, tipo_contratacao: r.tipoContratacao as any,
  interno_externo: r.internoExterno, origem_vaga: r.origemVaga,
  motivo_outros: r.motivoOutros, matricula: r.matricula,
  nome_substituido: r.nomeSubstituido, cargo_substituido: r.cargoSubstituido,
  salario_substituido: r.salarioSubstituido, data_desligamento: r.dataDesligamento,
  formacao: r.formacao as any, formacao_detalhe: r.formacaoDetalhe,
  experiencia: r.experiencia, conhecimento_informatica: r.conhecimentoInformatica,
  atividades_cargo: r.atividadesCargo, salario_vaga: r.salarioVaga,
  solicitante: r.solicitante ?? "",
  status: r.status, aprovado_por: r.aprovadoPor ?? "",
  historico_status: r.historicoStatus as any,
});

export function RequisicaoProvider({ children }: { children: ReactNode }) {
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("requisicoes", "created_at");
    setRequisicoes(data.map(rowToReq));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addRequisicao = async (req: Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "historicoStatus">) => {
    const maxNum = requisicoes.length > 0 ? Math.max(...requisicoes.map(r => r.numero)) : 0;
    const agora = new Date().toLocaleString("pt-BR");
    const full: Requisicao = {
      ...req, id: "", numero: maxNum + 1,
      dataCriacao: new Date().toLocaleDateString("pt-BR"),
      status: "Pendente",
      historicoStatus: [{ status: "Pendente", dataHora: agora }],
    };
    await insertRow("requisicoes", reqToRow(full));
    await load();

    const msg =
      `*Nova Requisição de Pessoal*\n\n` +
      `RP Nº: ${full.numero}\n` +
      `Cargo: ${full.cargoNome || "-"}\n` +
      `Unidade: ${full.unidade || "-"}\n` +
      `Solicitante: ${full.solicitante || "-"}\n` +
      `Data: ${full.dataCriacao}\n` +
      `Status: ${full.status}`;
    await enviarNotificacaoRP({ mensagem: msg, solicitante: full.solicitante });
  };

  const updateRequisicao = async (id: string, data: Partial<Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "aprovadoPor" | "historicoStatus">>) => {
    const current = requisicoes.find(r => r.id === id);
    if (!current) return;
    if (["Aprovada", "Reprovada", "Concluída"].includes(current.status)) return;
    const merged = { ...current, ...data };
    await updateRow("requisicoes", id, reqToRow(merged));
    await load();
  };

  const updateStatus = async (id: string, status: Requisicao["status"], aprovadoPor?: string) => {
    const current = requisicoes.find(r => r.id === id);
    if (!current) return;
    const agora = new Date().toLocaleString("pt-BR");
    const updated = {
      ...current, status, aprovadoPor: aprovadoPor || current.aprovadoPor,
      historicoStatus: [...(current.historicoStatus || []), { status, dataHora: agora, usuario: aprovadoPor }],
    };
    await updateRow("requisicoes", id, reqToRow(updated));
    await load();

    const msg =
      `*Atualização de Requisição de Pessoal*\n\n` +
      `RP Nº: ${current.numero}\n` +
      `Cargo: ${current.cargoNome || "-"}\n` +
      `Status: ${status}\n` +
      (aprovadoPor ? `Por: ${aprovadoPor}\n` : "") +
      `Data: ${agora}`;
    await enviarNotificacaoRP({ mensagem: msg, solicitante: current.solicitante });
  };

  return (
    <RequisicaoContext.Provider value={{ requisicoes, addRequisicao, updateRequisicao, updateStatus }}>
      {children}
    </RequisicaoContext.Provider>
  );
}

export function useRequisicoes() {
  const ctx = useContext(RequisicaoContext);
  if (!ctx) throw new Error("useRequisicoes must be used within RequisicaoProvider");
  return ctx;
}

