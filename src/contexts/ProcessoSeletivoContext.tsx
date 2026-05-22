import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";
import { enviarNotificacaoRP } from "@/lib/notificacaoRP";

async function notificarEtapaCandidato(requisicaoId: string, candidatoNome: string, evento: string, detalhes?: string) {
  try {
    const { data: req } = await (supabase as any)
      .from("requisicoes")
      .select("numero,cargo_nome,solicitante")
      .eq("id", requisicaoId)
      .maybeSingle();
    if (!req) return;
    const msg =
      `*Processo Seletivo - ${evento}*\n\n` +
      `RP Nº: ${req.numero}\n` +
      `Cargo: ${req.cargo_nome || "-"}\n` +
      `Candidato: ${candidatoNome}\n` +
      (detalhes ? `${detalhes}\n` : "") +
      `Data: ${new Date().toLocaleString("pt-BR")}`;
    await enviarNotificacaoRP({ mensagem: msg, solicitante: req.solicitante });
  } catch (e) {
    console.error("Falha notificação processo seletivo:", e);
  }
}


export type EtapaCandidato = "entrevista_psicologica" | "entrevista_tecnica" | "liberacao" | "contratacao";
export type StatusCandidato = "pendente" | "aprovado" | "neutro" | "reprovado";

export interface AnexoCandidato { nome: string; tipo: string; base64: string; }
export interface DocumentoContratacao { nome: string; entregue: boolean; anexo?: AnexoCandidato; naoPossui?: boolean; }
export interface ExameAdmissional { dataExame: string; resultado: "pendente" | "apto" | "inapto"; observacoes: string; anexo?: AnexoCandidato; }
export interface DadosBancarios { banco: string; agencia: string; conta: string; tipoConta: string; pisPasep: string; pix?: string; }

export const DOCUMENTOS_OBRIGATORIOS = [
  "CNH", "RG", "CPF", "CTPS (Carteira de Trabalho)", "Comprovante de Residência",
  "Certidão de Nascimento/Casamento", "Título de Eleitor", "Certificado de Reservista",
  "PIS/PASEP", "Foto 3x4", "Comprovante de Escolaridade",
  "Diploma ou Certificado de Formação",
  "Certidão de Nascimento dos Filhos", "Cartão de Vacina dos Filhos",
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
  lgpdAceite?: boolean; lgpdAceiteData?: string; portalEnviadoEm?: string;
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

  // Aplica um patch sobre o processo mais recente em memória (evita closures velhas em chamadas
  // sequenciais) e persiste em background.
  const applyPatch = async (
    id: string,
    patch: (p: ProcessoSeletivo) => ProcessoSeletivo,
  ): Promise<ProcessoSeletivo | null> => {
    let updated: ProcessoSeletivo | null = null;
    setProcessos(prev => prev.map(p => {
      if (p.id !== id) return p;
      updated = patch(p);
      return updated;
    }));
    if (updated) {
      try {
        await updateRow("processos_seletivos", id, processoToRow(updated));
      } catch (e) {
        console.error("Falha ao salvar processo seletivo, recarregando...", e);
        await load();
      }
    }
    return updated;
  };

  const saveAndReload = async (id: string, updated: ProcessoSeletivo) => {
    await applyPatch(id, () => updated);
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
      dadosBancarios: { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "", pix: "" },
    };
    await saveAndReload(processoId, { ...p, candidatos: [...p.candidatos, novoCandidato] });
  };

  const updateCandidato = async (processoId: string, candidatoId: string, data: Partial<Candidato>) => {
    let before: Candidato | undefined;
    let after: Candidato | undefined;
    let requisicaoIdRef: string | undefined;
    await applyPatch(processoId, (p) => {
      requisicaoIdRef = p.requisicaoId;
      before = p.candidatos.find(c => c.id === candidatoId);
      const novosCandidatos = p.candidatos.map(c => {
        if (c.id !== candidatoId) return c;
        const merged = { ...c, ...data };
        after = merged;
        return merged;
      });
      return { ...p, candidatos: novosCandidatos };
    });
    if (!before || !after || !requisicaoIdRef) return;
    const eventos: { evento: string; detalhes?: string }[] = [];
    if (data.statusPsicologico && data.statusPsicologico !== before.statusPsicologico) {
      eventos.push({ evento: "Avaliação Psicológica", detalhes: `Status: ${data.statusPsicologico}` });
    }
    if (data.statusTecnico && data.statusTecnico !== before.statusTecnico) {
      eventos.push({ evento: "Avaliação Técnica", detalhes: `Status: ${data.statusTecnico}${after.avaliadorTecnico ? ` | Avaliador: ${after.avaliadorTecnico}` : ""}` });
    }
    if (data.statusLiberacao && data.statusLiberacao !== before.statusLiberacao) {
      eventos.push({ evento: "Liberação", detalhes: `Status: ${data.statusLiberacao}${after.liberadoPor ? ` | Por: ${after.liberadoPor}` : ""}` });
    }
    if (data.contratacaoFinalizada && !before.contratacaoFinalizada) {
      eventos.push({ evento: "Contratação Finalizada" });
    }
    for (const ev of eventos) {
      await notificarEtapaCandidato(requisicaoIdRef, after.nome, ev.evento, ev.detalhes);
    }
  };

  const avancarEtapa = async (processoId: string, candidatoId: string) => {
    const etapas: EtapaCandidato[] = ["entrevista_psicologica", "entrevista_tecnica", "liberacao", "contratacao"];
    const p = processos.find(p => p.id === processoId);
    if (!p) return;
    let candidatoNotif: { nome: string; nextEtapa: EtapaCandidato } | null = null;
    await saveAndReload(processoId, {
      ...p, candidatos: p.candidatos.map(c => {
        if (c.id !== candidatoId) return c;
        const idx = etapas.indexOf(c.etapaAtual);
        if (idx < etapas.length - 1) {
          const nextEtapa = etapas[idx + 1];
          candidatoNotif = { nome: c.nome, nextEtapa };
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
    if (candidatoNotif) {
      const labels: Record<EtapaCandidato, string> = {
        entrevista_psicologica: "Entrevista Psicológica",
        entrevista_tecnica: "Entrevista Técnica",
        liberacao: "Liberação",
        contratacao: "Contratação",
      };
      await notificarEtapaCandidato(p.requisicaoId, candidatoNotif.nome, `Avanço de Etapa → ${labels[candidatoNotif.nextEtapa]}`);
    }
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
