import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type EtapaCandidato = "entrevista_psicologica" | "entrevista_tecnica" | "liberacao" | "contratacao";
export type StatusCandidato = "pendente" | "aprovado" | "neutro" | "reprovado";

export interface AnexoCandidato {
  nome: string;
  tipo: string;
  base64: string;
}

export interface DocumentoContratacao {
  nome: string;
  entregue: boolean;
}

export interface ExameAdmissional {
  dataExame: string;
  resultado: "pendente" | "apto" | "inapto";
  observacoes: string;
}

export interface DadosBancarios {
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  pisPasep: string;
}

export const DOCUMENTOS_OBRIGATORIOS = [
  "RG",
  "CPF",
  "CTPS (Carteira de Trabalho)",
  "Comprovante de Residência",
  "Certidão de Nascimento/Casamento",
  "Título de Eleitor",
  "Certificado de Reservista",
  "PIS/PASEP",
  "Foto 3x4",
  "Comprovante de Escolaridade",
  "Certidão de Nascimento dos Filhos",
  "Cartão de Vacina dos Filhos",
  "Atestado de Antecedentes Criminais",
];

export interface Candidato {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  idade: string;
  estadoCivil: string;
  experienciasAnteriores: string;
  anexos: AnexoCandidato[];
  etapaAtual: EtapaCandidato;
  // Datas do workflow
  dataEntrevistaPsicologica?: string;
  dataEntrevistaTecnica?: string;
  dataLiberacao?: string;
  dataContratacao?: string;
  // Etapa 1 – Entrevista Psicológica
  parecerPsicologo: string;
  statusPsicologico: StatusCandidato;
  // Etapa 2 – Entrevista Técnica
  avaliadorTecnico: string;
  parecerTecnico: string;
  statusTecnico: StatusCandidato;
  // Etapa 3 – Liberação
  liberadoPor: string;
  statusLiberacao: StatusCandidato;
  // Etapa 4 – Contratação
  documentos: DocumentoContratacao[];
  exameAdmissional: ExameAdmissional;
  dadosBancarios: DadosBancarios;
}

export interface ProcessoSeletivo {
  id: string;
  requisicaoId: string;
  dataCriacao: string;
  candidatos: Candidato[];
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

export function ProcessoSeletivoProvider({ children }: { children: ReactNode }) {
  const [processos, setProcessos] = useState<ProcessoSeletivo[]>(() => {
    const saved = localStorage.getItem("processosSeletivos");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("processosSeletivos", JSON.stringify(processos));
  }, [processos]);

  const criarProcesso = (requisicaoId: string): ProcessoSeletivo => {
    const existing = processos.find((p) => p.requisicaoId === requisicaoId);
    if (existing) return existing;

    const novo: ProcessoSeletivo = {
      id: crypto.randomUUID(),
      requisicaoId,
      dataCriacao: new Date().toLocaleDateString("pt-BR"),
      candidatos: [],
    };
    setProcessos((prev) => [novo, ...prev]);
    return novo;
  };

  const getProcessoByRequisicao = (requisicaoId: string) =>
    processos.find((p) => p.requisicaoId === requisicaoId);

  const addCandidato = (
    processoId: string,
    candidato: Omit<Candidato, "id" | "etapaAtual" | "parecerPsicologo" | "statusPsicologico" | "avaliadorTecnico" | "parecerTecnico" | "statusTecnico" | "liberadoPor" | "statusLiberacao" | "idade" | "estadoCivil" | "experienciasAnteriores" | "anexos"> & { anexos?: AnexoCandidato[] }
  ) => {
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        if (p.candidatos.length >= 5) return p;
        return {
          ...p,
          candidatos: [
            ...p.candidatos,
            {
              ...candidato,
              id: crypto.randomUUID(),
              etapaAtual: "entrevista_psicologica",
              idade: "",
              estadoCivil: "",
              experienciasAnteriores: "",
              anexos: candidato.anexos || [],
              dataEntrevistaPsicologica: new Date().toLocaleDateString("pt-BR"),
              parecerPsicologo: "",
              statusPsicologico: "pendente",
              avaliadorTecnico: "",
              parecerTecnico: "",
              statusTecnico: "pendente",
              liberadoPor: "",
              statusLiberacao: "pendente",
            },
          ],
        };
      })
    );
  };

  const updateCandidato = (processoId: string, candidatoId: string, data: Partial<Candidato>) => {
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        return {
          ...p,
          candidatos: p.candidatos.map((c) =>
            c.id === candidatoId ? { ...c, ...data } : c
          ),
        };
      })
    );
  };

  const avancarEtapa = (processoId: string, candidatoId: string) => {
    const etapas: EtapaCandidato[] = ["entrevista_psicologica", "entrevista_tecnica", "liberacao", "contratacao"];
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        return {
          ...p,
          candidatos: p.candidatos.map((c) => {
            if (c.id !== candidatoId) return c;
            const idx = etapas.indexOf(c.etapaAtual);
            if (idx < etapas.length - 1) {
              const nextEtapa = etapas[idx + 1];
              const dateNow = new Date().toLocaleDateString("pt-BR");
              const dateField =
                nextEtapa === "entrevista_tecnica" ? "dataEntrevistaTecnica" :
                nextEtapa === "liberacao" ? "dataLiberacao" :
                nextEtapa === "contratacao" ? "dataContratacao" : undefined;
              return {
                ...c,
                etapaAtual: nextEtapa,
                ...(dateField ? { [dateField]: dateNow } : {}),
              };
            }
            return c;
          }),
        };
      })
    );
  };

  return (
    <ProcessoSeletivoContext.Provider
      value={{ processos, criarProcesso, getProcessoByRequisicao, addCandidato, updateCandidato, avancarEtapa }}
    >
      {children}
    </ProcessoSeletivoContext.Provider>
  );
}

export function useProcessoSeletivo() {
  const ctx = useContext(ProcessoSeletivoContext);
  if (!ctx) throw new Error("useProcessoSeletivo must be used within ProcessoSeletivoProvider");
  return ctx;
}
