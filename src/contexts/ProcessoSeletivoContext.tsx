import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type EtapaCandidato = "entrevista_psicologica" | "entrevista_tecnica" | "liberacao" | "contratacao";
export type StatusCandidato = "pendente" | "aprovado" | "reprovado";

export interface Candidato {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  etapaAtual: EtapaCandidato;
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
  addCandidato: (processoId: string, candidato: Omit<Candidato, "id" | "etapaAtual" | "parecerPsicologo" | "statusPsicologico" | "avaliadorTecnico" | "parecerTecnico" | "statusTecnico" | "liberadoPor" | "statusLiberacao">) => void;
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
    candidato: Omit<Candidato, "id" | "etapaAtual" | "parecerPsicologo" | "statusPsicologico" | "avaliadorTecnico" | "parecerTecnico" | "statusTecnico" | "liberadoPor" | "statusLiberacao">
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
              return { ...c, etapaAtual: etapas[idx + 1] };
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
