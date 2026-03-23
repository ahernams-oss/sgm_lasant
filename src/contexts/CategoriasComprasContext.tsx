import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface GrupoCompras {
  id: string;
  codigo: string; // e.g. "01"
  nome: string;
}

export interface SubGrupoCompras {
  id: string;
  grupoId: string;
  codigo: string; // e.g. "001"
  nome: string;
}

export interface ClasseCompras {
  id: string;
  subGrupoId: string;
  codigo: string; // e.g. "001"
  nome: string;
}

export interface CategoriasComprasData {
  grupos: GrupoCompras[];
  subGrupos: SubGrupoCompras[];
  classes: ClasseCompras[];
}

interface CategoriasComprasContextType {
  grupos: GrupoCompras[];
  subGrupos: SubGrupoCompras[];
  classes: ClasseCompras[];
  addGrupo: (g: Omit<GrupoCompras, "id">) => void;
  updateGrupo: (id: string, data: Partial<Omit<GrupoCompras, "id">>) => void;
  deleteGrupo: (id: string) => void;
  addSubGrupo: (s: Omit<SubGrupoCompras, "id">) => void;
  updateSubGrupo: (id: string, data: Partial<Omit<SubGrupoCompras, "id">>) => void;
  deleteSubGrupo: (id: string) => void;
  addClasse: (c: Omit<ClasseCompras, "id">) => void;
  updateClasse: (id: string, data: Partial<Omit<ClasseCompras, "id">>) => void;
  deleteClasse: (id: string) => void;
  getCodigoCompleto: (classeId: string) => string;
  getDescricaoCompleta: (classeId: string) => string;
}

const CategoriasComprasContext = createContext<CategoriasComprasContextType | undefined>(undefined);

export function CategoriasComprasProvider({ children }: { children: ReactNode }) {
  const [grupos, setGrupos] = useState<GrupoCompras[]>(() => {
    const saved = localStorage.getItem("categorias_compras_grupos");
    return saved ? JSON.parse(saved) : [];
  });
  const [subGrupos, setSubGrupos] = useState<SubGrupoCompras[]>(() => {
    const saved = localStorage.getItem("categorias_compras_subgrupos");
    return saved ? JSON.parse(saved) : [];
  });
  const [classes, setClasses] = useState<ClasseCompras[]>(() => {
    const saved = localStorage.getItem("categorias_compras_classes");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("categorias_compras_grupos", JSON.stringify(grupos)); }, [grupos]);
  useEffect(() => { localStorage.setItem("categorias_compras_subgrupos", JSON.stringify(subGrupos)); }, [subGrupos]);
  useEffect(() => { localStorage.setItem("categorias_compras_classes", JSON.stringify(classes)); }, [classes]);

  const addGrupo = (g: Omit<GrupoCompras, "id">) =>
    setGrupos(prev => [...prev, { id: crypto.randomUUID(), ...g }]);
  const updateGrupo = (id: string, data: Partial<Omit<GrupoCompras, "id">>) =>
    setGrupos(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  const deleteGrupo = (id: string) => {
    const subIds = subGrupos.filter(s => s.grupoId === id).map(s => s.id);
    setClasses(prev => prev.filter(c => !subIds.includes(c.subGrupoId)));
    setSubGrupos(prev => prev.filter(s => s.grupoId !== id));
    setGrupos(prev => prev.filter(g => g.id !== id));
  };

  const addSubGrupo = (s: Omit<SubGrupoCompras, "id">) =>
    setSubGrupos(prev => [...prev, { id: crypto.randomUUID(), ...s }]);
  const updateSubGrupo = (id: string, data: Partial<Omit<SubGrupoCompras, "id">>) =>
    setSubGrupos(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteSubGrupo = (id: string) => {
    setClasses(prev => prev.filter(c => c.subGrupoId !== id));
    setSubGrupos(prev => prev.filter(s => s.id !== id));
  };

  const addClasse = (c: Omit<ClasseCompras, "id">) =>
    setClasses(prev => [...prev, { id: crypto.randomUUID(), ...c }]);
  const updateClasse = (id: string, data: Partial<Omit<ClasseCompras, "id">>) =>
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteClasse = (id: string) =>
    setClasses(prev => prev.filter(c => c.id !== id));

  const getCodigoCompleto = (classeId: string): string => {
    const classe = classes.find(c => c.id === classeId);
    if (!classe) return "";
    const sub = subGrupos.find(s => s.id === classe.subGrupoId);
    if (!sub) return classe.codigo;
    const grupo = grupos.find(g => g.id === sub.grupoId);
    if (!grupo) return `${sub.codigo}.${classe.codigo}`;
    return `${grupo.codigo}.${sub.codigo}.${classe.codigo}`;
  };

  const getDescricaoCompleta = (classeId: string): string => {
    const classe = classes.find(c => c.id === classeId);
    if (!classe) return "";
    const codigo = getCodigoCompleto(classeId);
    return `${codigo} - ${classe.nome}`;
  };

  return (
    <CategoriasComprasContext.Provider value={{
      grupos, subGrupos, classes,
      addGrupo, updateGrupo, deleteGrupo,
      addSubGrupo, updateSubGrupo, deleteSubGrupo,
      addClasse, updateClasse, deleteClasse,
      getCodigoCompleto, getDescricaoCompleta,
    }}>
      {children}
    </CategoriasComprasContext.Provider>
  );
}

export function useCategoriasCompras() {
  const ctx = useContext(CategoriasComprasContext);
  if (!ctx) throw new Error("useCategoriasCompras must be used within CategoriasComprasProvider");
  return ctx;
}
