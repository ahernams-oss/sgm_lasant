import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface StatusHistorico {
  status: string;
  dataHora: string;
  usuario?: string;
}

export interface Requisicao {
  id: string;
  numero: number;
  dataCriacao: string;
  unidade: string;
  cargoNome: string;
  cargoId: string;
  jornada: string;
  cargaHoraria: string;
  tipoContratacao: string[];
  internoExterno: string;
  origemVaga: string;
  motivoOutros: string;
  matricula: string;
  nomeSubstituido: string;
  cargoSubstituido: string;
  salarioSubstituido: string;
  dataDesligamento: string;
  formacao: string[];
  formacaoDetalhe: string;
  experiencia: string;
  conhecimentoInformatica: string;
  atividadesCargo: string;
  salarioVaga: string;
  status: "Pendente" | "Em Análise" | "Aprovada" | "Reprovada" | "Concluída";
  aprovadoPor?: string;
  historicoStatus: StatusHistorico[];
}

interface RequisicaoContextType {
  requisicoes: Requisicao[];
  addRequisicao: (req: Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "aprovadoPor" | "historicoStatus">) => void;
  updateRequisicao: (id: string, data: Partial<Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "aprovadoPor" | "historicoStatus">>) => void;
  updateStatus: (id: string, status: Requisicao["status"], aprovadoPor?: string) => void;
}

const RequisicaoContext = createContext<RequisicaoContextType | undefined>(undefined);

export function RequisicaoProvider({ children }: { children: ReactNode }) {
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>(() => {
    const saved = localStorage.getItem("requisicoes");
    if (!saved) return [];
    // Migra dados antigos
    const parsed = JSON.parse(saved);
    return parsed.map((r: any, idx: number) => ({
      numero: r.numero ?? parsed.length - idx,
      cargoId: r.cargoId || "",
      cargaHoraria: r.cargaHoraria || "",
      internoExterno: r.internoExterno || "",
      motivoOutros: r.motivoOutros || "",
      matricula: r.matricula || "",
      cargoSubstituido: r.cargoSubstituido || "",
      salarioSubstituido: r.salarioSubstituido || "",
      dataDesligamento: r.dataDesligamento || "",
      formacao: r.formacao || [],
      formacaoDetalhe: r.formacaoDetalhe || "",
      experiencia: r.experiencia || "",
      conhecimentoInformatica: r.conhecimentoInformatica || "",
      atividadesCargo: r.atividadesCargo || "",
      salarioVaga: r.salarioVaga || "",
      ...r,
    }));
  });

  const [nextNumero, setNextNumero] = useState<number>(() => {
    const saved = localStorage.getItem("requisicoes");
    if (!saved) return 1;
    const parsed = JSON.parse(saved);
    const maxNum = parsed.reduce((max: number, r: any) => Math.max(max, r.numero ?? 0), 0);
    return maxNum + 1;
  });

  useEffect(() => { localStorage.setItem("requisicoes", JSON.stringify(requisicoes)); }, [requisicoes]);

  const addRequisicao = (req: Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status">) => {
    const numero = nextNumero;
    setNextNumero((n) => n + 1);
    setRequisicoes((prev) => [
      {
        id: crypto.randomUUID(),
        numero,
        dataCriacao: new Date().toLocaleDateString("pt-BR"),
        status: "Pendente",
        ...req,
      },
      ...prev,
    ]);
  };

  const updateRequisicao = (id: string, data: Partial<Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "aprovadoPor">>) =>
    setRequisicoes((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      // Só permite editar se não estiver aprovada/reprovada/concluída
      if (r.status === "Aprovada" || r.status === "Reprovada" || r.status === "Concluída") return r;
      return { ...r, ...data };
    }));

  const updateStatus = (id: string, status: Requisicao["status"], aprovadoPor?: string) =>
    setRequisicoes((prev) => prev.map((r) => (r.id === id ? { ...r, status, aprovadoPor: aprovadoPor || r.aprovadoPor } : r)));

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