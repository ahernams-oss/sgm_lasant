import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow } from "@/lib/supabaseHelper";

export type EtapaCandidato = "entrevista_psicologica" | "entrevista_tecnica" | "liberacao" | "contratacao";
export type StatusCandidato = "pendente" | "aprovado" | "neutro" | "reprovado";

export interface AnexoCandidato { nome: string; tipo: string; base64: string; }
export interface DocumentoContratacao { nome: string; entregue: boolean; anexo?: AnexoCandidato; }
export interface ExameAdmissional { dataExame: string; resultado: "pendente" | "apto" | "inapto"; observacoes: string; anexo?: AnexoCandidato; }
export interface DadosBancarios { banco: string; agencia: string; conta: string; tipoConta: string; pisPasep: string; }

export const DOCUMENTOS_OBRIGATORIOS = [
  "RG", "CPF", "CTPS (Carteira de Trabalho)", "Comprovante de Residência",
  "Certidão de Nascimento/Casamento", "Título de Eleitor", "Certificado de Reservista",
  "PIS/PASEP", "Foto 3x4", "Comprovante de Escolaridade",
  "Certidão de Nascimento dos Filhos", "Cartão de Vacina dos Filhos",
  "Atestado de Antecedentes Criminais",
];

export interface Candidato {
  id: string; nome: string; telefone: string; email: string;
  idade: string; estadoCivil: string; experienciasAnteriores: string;
  anexos: AnexoCandidato[]; etapaAtual: EtapaCandidato;
  dataEntrevistaPsicologica?: string; dataEntrevistaTecnica?: string;
  dataLiberacao?: string; dataContratacao?: string;
  parecerPsicologo: string; statusPsicologico: StatusCandidato;
  avaliadorTecnico: string; parecerTecnico: string; statusTecnico: StatusCandidato;
  liberadoPor: string; statusLiberacao: StatusCandidato;
  documentos: DocumentoContratacao[]; exameAdmissional: ExameAdmissional;
  dadosBancarios: DadosBancarios; contratacaoFinalizada?: boolean;
}

export interface ProcessoSeletivo {
  id: string; requisicaoId: string; dataCriacao: string; candidatos: Candidato[];
}

interface ProcessoSeletivoContextType {
  processos: ProcessoSeletivo[];
  criarProcesso: (requisicaoId: string) => ProcessoSeletivo;
  getProcessoByRequisicao: (requisicaoId: string) => ProcessoSeletivo | undefined;
  addCandidato: (processoId: string, candidato: Omit<Candidato, "id" | "etapaAtual" | "parecerPsicologo" | "statusPsicologico" | "avaliadorTecnico" | "parecerTecnico" | "statusTecnico" | "liberadoPor" | "statusLiberacao" | "idade" | "estadoCivil" | "experienciasAnteriores" | "anexos" | "documentos" | "exameAdmissional" | "dadosBancarios"> & { anexos?: AnexoCandidato[] }) => void;
  updateCandidato: (processoId: string, candidatoId: string, data: Partial<Candidato>) => void;
  avancarEtapa: (processoId: string, candidatoId: string) => void;
}

const ProcessoSeletivoContext = createContext<ProcessoSeletivoContextType | undefined>(undefined);

const rowToProcesso = (r: any): ProcessoSeletivo => ({
  id: r.id, requisicaoId: r.requisicao_id ?? "", dataCriacao: r.data_criacao ?? "",
  candidatos: r.candidatos ?? [],
});

const processoToRow = (p: ProcessoSeletivo) => ({
  requisicao_id: p.requisicaoId, data_criacao: p.dataCriacao, candidatos: p.candidatos as any,
});

export function ProcessoSeletivoProvider({ children }: { children: ReactNode }) {
  const [processos, setProcessos] = useState<ProcessoSeletivo[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("processos_seletivos", "created_at");
    setProcessos(data.map(rowToProcesso));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveAndReload = async (id: string, updated: ProcessoSeletivo) => {
    await updateRow("processos_seletivos", id, processoToRow(updated));
    await load();
  };

  const criarProcesso = (requisicaoId: string): ProcessoSeletivo => {
    const existing = processos.find(p => p.requisicaoId === requisicaoId);
    if (existing) return existing;
    const novo: ProcessoSeletivo = {
      id: crypto.randomUUID(), requisicaoId,
      dataCriacao: new Date().toLocaleDateString("pt-BR"), candidatos: [],
    };
    insertRow("processos_seletivos", processoToRow(novo)).then(() => load());
    return novo;
  };

  const getProcessoByRequisicao = (requisicaoId: string) =>
    processos.find(p => p.requisicaoId === requisicaoId);

  const addCandidato = async (
    processoId: string,
    candidato: Omit<Candidato, "id" | "etapaAtual" | "parecerPsicologo" | "statusPsicologico" | "avaliadorTecnico" | "parecerTecnico" | "statusTecnico" | "liberadoPor" | "statusLiberacao" | "idade" | "estadoCivil" | "experienciasAnteriores" | "anexos" | "documentos" | "exameAdmissional" | "dadosBancarios"> & { anexos?: AnexoCandidato[] }
  ) => {
    const p = processos.find(p => p.id === processoId);
    if (!p || p.candidatos.length >= 5) return;
    const novoCandidato: Candidato = {
      ...candidato, id: crypto.randomUUID(),
      etapaAtual: "entrevista_psicologica", idade: "", estadoCivil: "",
      experienciasAnteriores: "", anexos: candidato.anexos || [],
      dataEntrevistaPsicologica: new Date().toLocaleDateString("pt-BR"),
      parecerPsicologo: "", statusPsicologico: "pendente",
      avaliadorTecnico: "", parecerTecnico: "", statusTecnico: "pendente",
      liberadoPor: "", statusLiberacao: "pendente",
      documentos: DOCUMENTOS_OBRIGATORIOS.map(nome => ({ nome, entregue: false })),
      exameAdmissional: { dataExame: "", resultado: "pendente", observacoes: "" },
      dadosBancarios: { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "" },
    };
    await saveAndReload(processoId, { ...p, candidatos: [...p.candidatos, novoCandidato] });
  };

  const updateCandidato = async (processoId: string, candidatoId: string, data: Partial<Candidato>) => {
    const p = processos.find(p => p.id === processoId);
    if (!p) return;
    await saveAndReload(processoId, {
      ...p, candidatos: p.candidatos.map(c => c.id === candidatoId ? { ...c, ...data } : c),
    });
  };

  const avancarEtapa = async (processoId: string, candidatoId: string) => {
    const etapas: EtapaCandidato[] = ["entrevista_psicologica", "entrevista_tecnica", "liberacao", "contratacao"];
    const p = processos.find(p => p.id === processoId);
    if (!p) return;
    await saveAndReload(processoId, {
      ...p, candidatos: p.candidatos.map(c => {
        if (c.id !== candidatoId) return c;
        const idx = etapas.indexOf(c.etapaAtual);
        if (idx < etapas.length - 1) {
          const nextEtapa = etapas[idx + 1];
          const dateNow = new Date().toLocaleDateString("pt-BR");
          const dateField =
            nextEtapa === "entrevista_tecnica" ? "dataEntrevistaTecnica" :
            nextEtapa === "liberacao" ? "dataLiberacao" :
            nextEtapa === "contratacao" ? "dataContratacao" : undefined;
          return { ...c, etapaAtual: nextEtapa, ...(dateField ? { [dateField]: dateNow } : {}) };
        }
        return c;
      }),
    });
  };

  return (
    <ProcessoSeletivoContext.Provider value={{ processos, criarProcesso, getProcessoByRequisicao, addCandidato, updateCandidato, avancarEtapa }}>
      {children}
    </ProcessoSeletivoContext.Provider>
  );
}

export function useProcessoSeletivo() {
  const ctx = useContext(ProcessoSeletivoContext);
  if (!ctx) throw new Error("useProcessoSeletivo must be used within ProcessoSeletivoProvider");
  return ctx;
}
