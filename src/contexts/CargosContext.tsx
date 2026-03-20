import { createContext, useContext, useState, ReactNode } from "react";

export interface Cargo {
  id: string;
  nome: string;
  descricao: string;
  salario: string;
  nivel: string;
}

interface CargosContextType {
  cargos: Cargo[];
  addCargo: (cargo: Omit<Cargo, "id">) => void;
  updateCargo: (id: string, cargo: Omit<Cargo, "id">) => void;
  deleteCargo: (id: string) => void;
}

const CargosContext = createContext<CargosContextType | undefined>(undefined);

export function CargosProvider({ children }: { children: ReactNode }) {
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const addCargo = (cargo: Omit<Cargo, "id">) =>
    setCargos((prev) => [...prev, { id: crypto.randomUUID(), ...cargo }]);

  const updateCargo = (id: string, data: Omit<Cargo, "id">) =>
    setCargos((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

  const deleteCargo = (id: string) =>
    setCargos((prev) => prev.filter((c) => c.id !== id));

  return (
    <CargosContext.Provider value={{ cargos, addCargo, updateCargo, deleteCargo }}>
      {children}
    </CargosContext.Provider>
  );
}

export function useCargos() {
  const ctx = useContext(CargosContext);
  if (!ctx) throw new Error("useCargos must be used within CargosProvider");
  return ctx;
}