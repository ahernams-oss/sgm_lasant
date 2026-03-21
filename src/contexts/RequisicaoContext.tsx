import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Requisicao {
  id: string;
  numero: number;
  dataCriacao: string;
  unidade: string;
  cargoNome: string;
  jornada: string;
  tipoContratacao: string[];
  origemVaga: string;
  nomeSubstituido: string;
  status: "Pendente" | "Em Análise" | "Aprovada" | "Reprovada";
  aprovadoPor?: string;
}

interface RequisicaoContextType {
  requisicoes: Requisicao[];
  addRequisicao: (req: Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status" | "aprovadoPor">) => void;
  updateStatus: (id: string, status: Requisicao["status"], aprovadoPor?: string) => void;
}

const RequisicaoContext = createContext<RequisicaoContextType | undefined>(undefined);

export function RequisicaoProvider({ children }: { children: ReactNode }) {
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>(() => {
    const saved = localStorage.getItem("requisicoes");
    if (!saved) return [];
    // Migra dados antigos sem número
    const parsed = JSON.parse(saved);
    return parsed.map((r: any, idx: number) => ({
      ...r,
      numero: r.numero ?? parsed.length - idx,
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

  const updateStatus = (id: string, status: Requisicao["status"]) =>
    setRequisicoes((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <RequisicaoContext.Provider value={{ requisicoes, addRequisicao, updateStatus }}>
      {children}
    </RequisicaoContext.Provider>
  );
}

export function useRequisicoes() {
  const ctx = useContext(RequisicaoContext);
  if (!ctx) throw new Error("useRequisicoes must be used within RequisicaoProvider");
  return ctx;
}