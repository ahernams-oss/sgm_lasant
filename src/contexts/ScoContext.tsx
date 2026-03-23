import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type TipoSco = "SCO" | "SINAPI" | "EMOP";

export const tiposSco: TipoSco[] = ["SCO", "SINAPI", "EMOP"];

export interface Sco {
  id: string;
  codSco: string;
  descricaoSco: string;
  unidade: string;
  tipo: TipoSco;
}

export const emptyScoForm: Omit<Sco, "id"> = {
  codSco: "",
  descricaoSco: "",
  unidade: "",
  tipo: "SCO",
};

interface ScoContextType {
  scos: Sco[];
  addSco: (s: Omit<Sco, "id">) => void;
  updateSco: (id: string, s: Partial<Omit<Sco, "id">>) => void;
  deleteSco: (id: string) => void;
}

const ScoContext = createContext<ScoContextType | undefined>(undefined);

export function ScoProvider({ children }: { children: ReactNode }) {
  const [scos, setScos] = useState<Sco[]>(() => {
    const saved = localStorage.getItem("scos");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("scos", JSON.stringify(scos));
  }, [scos]);

  const addSco = (s: Omit<Sco, "id">) =>
    setScos((prev) => [...prev, { id: crypto.randomUUID(), ...s }]);

  const updateSco = (id: string, data: Partial<Omit<Sco, "id">>) =>
    setScos((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));

  const deleteSco = (id: string) =>
    setScos((prev) => prev.filter((s) => s.id !== id));

  return (
    <ScoContext.Provider value={{ scos, addSco, updateSco, deleteSco }}>
      {children}
    </ScoContext.Provider>
  );
}

export function useSco() {
  const ctx = useContext(ScoContext);
  if (!ctx) throw new Error("useSco must be used within ScoProvider");
  return ctx;
}
