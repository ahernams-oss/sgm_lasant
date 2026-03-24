import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Fabricante {
  id: string;
  nome: string;
}

interface FabricantesContextType {
  fabricantes: Fabricante[];
  addFabricante: (nome: string) => void;
  updateFabricante: (id: string, nome: string) => void;
  deleteFabricante: (id: string) => void;
}

const FabricantesContext = createContext<FabricantesContextType | undefined>(undefined);

export function FabricantesProvider({ children }: { children: ReactNode }) {
  const [fabricantes, setFabricantes] = useState<Fabricante[]>(() => {
    const saved = localStorage.getItem("fabricantes");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("fabricantes", JSON.stringify(fabricantes)); }, [fabricantes]);

  const addFabricante = (nome: string) =>
    setFabricantes(prev => [...prev, { id: crypto.randomUUID(), nome }]);

  const updateFabricante = (id: string, nome: string) =>
    setFabricantes(prev => prev.map(f => f.id === id ? { ...f, nome } : f));

  const deleteFabricante = (id: string) =>
    setFabricantes(prev => prev.filter(f => f.id !== id));

  return (
    <FabricantesContext.Provider value={{ fabricantes, addFabricante, updateFabricante, deleteFabricante }}>
      {children}
    </FabricantesContext.Provider>
  );
}

export function useFabricantes() {
  const ctx = useContext(FabricantesContext);
  if (!ctx) throw new Error("useFabricantes must be used within FabricantesProvider");
  return ctx;
}
