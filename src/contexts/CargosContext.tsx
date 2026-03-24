import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface SalarioDataBase { id: string; valor: string; dataBase: string; }
export interface AnexoCargo { id: string; nome: string; url: string; tipo: string; }
export interface NrCargo { id: string; numero: string; descricao: string; }

export interface Cargo {
  id: string; nome: string; cbo: string; descricao: string; salario: string;
  nivel: string; dataBaseSalario: string; salarios: SalarioDataBase[];
  missao: string; responsabilidades: string; perfilCompetencias: string;
  anexos: AnexoCargo[]; nrs: NrCargo[];
}

interface CargosContextType {
  cargos: Cargo[]; addCargo: (cargo: Omit<Cargo, "id">) => void;
  updateCargo: (id: string, cargo: Partial<Omit<Cargo, "id">>) => void;
  deleteCargo: (id: string) => void;
}

const CargosContext = createContext<CargosContextType | undefined>(undefined);

const rowToCargo = (r: any): Cargo => ({
  id: r.id, nome: r.nome ?? "", cbo: r.cbo ?? "", descricao: r.descricao ?? "",
  salario: r.salario ?? "", nivel: r.nivel ?? "", dataBaseSalario: r.data_base_salario ?? "",
  salarios: r.salarios ?? [], missao: r.missao ?? "", responsabilidades: r.responsabilidades ?? "",
  perfilCompetencias: r.perfil_competencias ?? "", anexos: r.anexos ?? [], nrs: r.nrs ?? [],
});

const cargoToRow = (c: Omit<Cargo, "id">) => ({
  nome: c.nome, cbo: c.cbo, descricao: c.descricao, salario: c.salario,
  nivel: c.nivel, data_base_salario: c.dataBaseSalario, salarios: c.salarios as any,
  missao: c.missao, responsabilidades: c.responsabilidades,
  perfil_competencias: c.perfilCompetencias, anexos: c.anexos as any, nrs: c.nrs as any,
});

export function CargosProvider({ children }: { children: ReactNode }) {
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("cargos", "nome");
    setCargos(data.map(rowToCargo));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCargo = async (cargo: Omit<Cargo, "id">) => {
    await insertRow("cargos", cargoToRow(cargo));
    await load();
  };

  const updateCargo = async (id: string, data: Partial<Omit<Cargo, "id">>) => {
    const current = cargos.find(c => c.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    const { id: _, ...rest } = merged;
    await updateRow("cargos", id, cargoToRow(rest));
    await load();
  };

  const deleteCargo = async (id: string) => {
    await deleteRow("cargos", id);
    await load();
  };

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
