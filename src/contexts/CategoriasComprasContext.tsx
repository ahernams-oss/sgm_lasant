import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CategoriaCompras {
  id: string;
  nome: string;
  descricao: string;
}

interface CategoriasComprasContextType {
  categorias: CategoriaCompras[];
  addCategoria: (c: Omit<CategoriaCompras, "id">) => void;
  updateCategoria: (id: string, data: Partial<Omit<CategoriaCompras, "id">>) => void;
  deleteCategoria: (id: string) => void;
}

const CategoriasComprasContext = createContext<CategoriasComprasContextType | undefined>(undefined);

export function CategoriasComprasProvider({ children }: { children: ReactNode }) {
  const [categorias, setCategorias] = useState<CategoriaCompras[]>(() => {
    const saved = localStorage.getItem("categorias_compras");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("categorias_compras", JSON.stringify(categorias)); }, [categorias]);

  const addCategoria = (c: Omit<CategoriaCompras, "id">) =>
    setCategorias(prev => [...prev, { id: crypto.randomUUID(), ...c }]);

  const updateCategoria = (id: string, data: Partial<Omit<CategoriaCompras, "id">>) =>
    setCategorias(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));

  const deleteCategoria = (id: string) =>
    setCategorias(prev => prev.filter(c => c.id !== id));

  return (
    <CategoriasComprasContext.Provider value={{ categorias, addCategoria, updateCategoria, deleteCategoria }}>
      {children}
    </CategoriasComprasContext.Provider>
  );
}

export function useCategoriasCompras() {
  const ctx = useContext(CategoriasComprasContext);
  if (!ctx) throw new Error("useCategoriasCompras must be used within CategoriasComprasProvider");
  return ctx;
}
