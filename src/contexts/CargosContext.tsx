import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SalarioDataBase {
  id: string;
  valor: string;
  dataBase: string;
}

export interface AnexoCargo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
}

export interface Cargo {
  id: string;
  nome: string;
  cbo: string;
  descricao: string;
  salario: string;
  nivel: string;
  dataBaseSalario: string;
  salarios: SalarioDataBase[];
  missao: string;
  responsabilidades: string;
  perfilCompetencias: string;
  anexos: AnexoCargo[];
}

interface CargosContextType {
  cargos: Cargo[];
  addCargo: (cargo: Omit<Cargo, "id">) => void;
  updateCargo: (id: string, cargo: Partial<Omit<Cargo, "id">>) => void;
  deleteCargo: (id: string) => void;
}

const CargosContext = createContext<CargosContextType | undefined>(undefined);

const migrateCargo = (c: any): Cargo => {
  const salarios: SalarioDataBase[] = c.salarios || [];
  // Migrate legacy single salary into array if empty
  if (salarios.length === 0 && c.salario) {
    salarios.push({
      id: crypto.randomUUID(),
      valor: c.salario,
      dataBase: c.dataBaseSalario || "",
    });
  }
  return {
    id: c.id,
    cbo: c.cbo || "",
    nome: c.nome || "",
    descricao: c.descricao || "",
    salario: c.salario || "",
    nivel: c.nivel || "",
    dataBaseSalario: c.dataBaseSalario || "",
    salarios,
    missao: c.missao || "",
    responsabilidades: c.responsabilidades || "",
    perfilCompetencias: c.perfilCompetencias || "",
  };
};

export function CargosProvider({ children }: { children: ReactNode }) {
  const [cargos, setCargos] = useState<Cargo[]>(() => {
    const saved = localStorage.getItem("cargos");
    return saved ? JSON.parse(saved).map(migrateCargo) : [];
  });

  useEffect(() => { localStorage.setItem("cargos", JSON.stringify(cargos)); }, [cargos]);

  const addCargo = (cargo: Omit<Cargo, "id">) =>
    setCargos((prev) => [...prev, { id: crypto.randomUUID(), ...cargo }]);

  const updateCargo = (id: string, data: Partial<Omit<Cargo, "id">>) =>
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
