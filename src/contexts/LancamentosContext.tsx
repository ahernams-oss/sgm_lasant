import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type TipoLancamento = "falta" | "hora_extra";
export type TipoFalta = "justificada" | "injustificada" | "atestado" | "suspensao";

export interface AnexoFalta {
  nome: string;
  tipo: string;
  base64: string;
}

export interface Lancamento {
  id: string;
  funcionarioId: string;
  tipo: TipoLancamento;
  data: string; // YYYY-MM-DD
  // Faltas
  tipoFalta?: TipoFalta;
  diasFalta?: number;
  anexos?: AnexoFalta[];
  // Horas extras
  horasExtras?: number;
  percentual?: number;
  // Comum
  observacao: string;
  criadoEm: string;
}

interface LancamentosContextType {
  lancamentos: Lancamento[];
  addLancamento: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
  updateLancamento: (id: string, l: Partial<Omit<Lancamento, "id" | "criadoEm">>) => void;
  deleteLancamento: (id: string) => void;
}

const LancamentosContext = createContext<LancamentosContextType | undefined>(undefined);

export function LancamentosProvider({ children }: { children: ReactNode }) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(() => {
    const saved = localStorage.getItem("lancamentos");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  }, [lancamentos]);

  const addLancamento = (l: Omit<Lancamento, "id" | "criadoEm">) =>
    setLancamentos((prev) => [...prev, { id: crypto.randomUUID(), criadoEm: new Date().toISOString(), ...l }]);

  const updateLancamento = (id: string, data: Partial<Omit<Lancamento, "id" | "criadoEm">>) =>
    setLancamentos((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));

  const deleteLancamento = (id: string) =>
    setLancamentos((prev) => prev.filter((l) => l.id !== id));

  return (
    <LancamentosContext.Provider value={{ lancamentos, addLancamento, updateLancamento, deleteLancamento }}>
      {children}
    </LancamentosContext.Provider>
  );
}

export function useLancamentos() {
  const ctx = useContext(LancamentosContext);
  if (!ctx) throw new Error("useLancamentos must be used within LancamentosProvider");
  return ctx;
}
