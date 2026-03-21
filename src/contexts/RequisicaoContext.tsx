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
}

interface RequisicaoContextType {
  requisicoes: Requisicao[];
  addRequisicao: (req: Omit<Requisicao, "id" | "numero" | "dataCriacao" | "status">) => void;
  updateStatus: (id: string, status: Requisicao["status"]) => void;
}

const RequisicaoContext = createContext<RequisicaoContextType | undefined>(undefined);

export function RequisicaoProvider({ children }: { children: ReactNode }) {
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>(() => {
    const saved = localStorage.getItem("requisicoes");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("requisicoes", JSON.stringify(requisicoes)); }, [requisicoes]);

  const addRequisicao = (req: Omit<Requisicao, "id" | "dataCriacao" | "status">) => {
    setRequisicoes((prev) => [
      {
        id: crypto.randomUUID(),
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