import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface MaterialServico {
  id: string;
  codigo: string;
  descricao: string;
  tipo: "Material" | "Serviço";
  unidadeMedida: string;
  categoriaId: string;
  fabricanteId: string;
}

interface MateriaisServicosContextType {
  materiais: MaterialServico[];
  addMaterial: (m: Omit<MaterialServico, "id" | "codigo">) => void;
  updateMaterial: (id: string, data: Partial<Omit<MaterialServico, "id">>) => void;
  deleteMaterial: (id: string) => void;
}

const MateriaisServicosContext = createContext<MateriaisServicosContextType | undefined>(undefined);

export function MateriaisServicosProvider({ children }: { children: ReactNode }) {
  const [materiais, setMateriais] = useState<MaterialServico[]>(() => {
    const saved = localStorage.getItem("materiais_servicos");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("materiais_servicos", JSON.stringify(materiais)); }, [materiais]);

  const nextCodigo = () => {
    const nums = materiais.map(m => parseInt(m.codigo, 10)).filter(n => !isNaN(n));
    return String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(6, "0");
  };

  const addMaterial = (m: Omit<MaterialServico, "id" | "codigo">) =>
    setMateriais(prev => [...prev, { id: crypto.randomUUID(), codigo: nextCodigo(), ...m }]);

  const updateMaterial = (id: string, data: Partial<Omit<MaterialServico, "id">>) =>
    setMateriais(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));

  const deleteMaterial = (id: string) =>
    setMateriais(prev => prev.filter(m => m.id !== id));

  return (
    <MateriaisServicosContext.Provider value={{ materiais, addMaterial, updateMaterial, deleteMaterial }}>
      {children}
    </MateriaisServicosContext.Provider>
  );
}

export function useMateriaisServicos() {
  const ctx = useContext(MateriaisServicosContext);
  if (!ctx) throw new Error("useMateriaisServicos must be used within MateriaisServicosProvider");
  return ctx;
}
